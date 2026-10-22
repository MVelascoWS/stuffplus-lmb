"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, Segmentado } from "@/components/consola/Panel";
import { TIPO_PLURAL } from "@/components/consola/textos";
import { useJson } from "@/components/useJson";
import { fmt0, fmt1, fmtStuff } from "@/lib/format";
import type { PitchType, SedeResult } from "@/lib/simulator";
import type { Forma, MovementMap as MapData } from "@/types/convocatoria";

type Sede = "mar" | "hh";

/** Qué campos de cada forma corresponden a cada sede. */
const CAMPOS: Record<Sede, { ivb: keyof Forma; hb: keyof Forma; s: keyof Forma; pct: keyof Forma; label: string; result: SedeResult["sede"] }> = {
  mar: { ivb: "ivb", hb: "hb", s: "s_mar", pct: "s_mar_pct", label: "Sin altitud", result: "No Altitude" },
  hh: { ivb: "ivb_hh", hb: "hb_hh", s: "s_hh", pct: "s_hh_pct", label: "Harp Helú", result: "Harp Helu" },
};

/** Percentil a partir del cual se resalta lo más efectivo (y su espejo, lo menos efectivo). */
const RESALTE_PCT = 90;

// Escala divergente de docs/diseno.md: --frio, gris neutro en el percentil 50 de su tipo, --rojo.
const FRIO = [94, 115, 133], NEUTRO = [217, 212, 209], ROJO = [200, 16, 46];
function color(pct: number) {
  const t = Math.max(-1, Math.min(1, (pct - 50) / 50));
  const [a, b, f] = t < 0 ? [NEUTRO, FRIO, -t] : [NEUTRO, ROJO, t];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(",")})`;
}

interface Punto { x: number; y: number; s: number; pct: number; velo: number; propio?: boolean }

/** Cada forma se dibuja según su percentil: rombo (lo más efectivo), cuadro hueco (lo menos) o punto. */
function Figura(props: { cx?: number; cy?: number; payload?: Punto }) {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return null;
  const c = color(payload.pct);
  if (payload.pct >= RESALTE_PCT) {
    return <rect x={cx - 4.5} y={cy - 4.5} width={9} height={9} transform={`rotate(45 ${cx} ${cy})`} fill={c} stroke="var(--tinta)" strokeWidth={1} />;
  }
  if (payload.pct <= 100 - RESALTE_PCT) {
    return <rect x={cx - 3.5} y={cy - 3.5} width={7} height={7} fill="var(--papel)" stroke={c} strokeWidth={1.6} />;
  }
  return <circle cx={cx} cy={cy} r={3.3} fill={c} fillOpacity={0.9} />;
}

/** El lanzamiento capturado: estrella negra con borde blanco, encima de todo. */
function Estrella({ cx = 0, cy = 0 }: { cx?: number; cy?: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 5.5 : 13, a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={pts} fill="var(--tinta)" stroke="var(--papel)" strokeWidth={2} />;
}

function ejes(valores: number[]): { domain: [number, number]; ticks: number[] } {
  const lo = Math.floor((Math.min(0, ...valores) - 1) / 5) * 5;
  const hi = Math.ceil((Math.max(0, ...valores) + 1) / 5) * 5;
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += 5) ticks.push(v);
  return { domain: [lo, hi], ticks };
}

const EJE = { fontSize: 11, fill: "var(--grafito)" };

/** "¿Qué formas funcionan aquí?": las formas de la liga del mismo tipo, por su efectividad en la sede elegida. */
export function MovementMap({ tipo, results, className }: { tipo: PitchType; results: SedeResult[]; className?: string }) {
  const { data, error } = useJson<MapData>("movement_map.json");
  const [sede, setSede] = useState<Sede>("hh");
  const formas = useMemo(() => data?.formas.filter((f) => f.tipo === tipo) ?? [], [data, tipo]);
  const c = CAMPOS[sede];
  // Lo más efectivo se dibuja al final, encima del resto.
  const puntos: Punto[] = useMemo(
    () => formas
      .map((f) => ({ x: f[c.hb] as number, y: f[c.ivb] as number, s: f[c.s] as number, pct: f[c.pct] as number, velo: f.velo }))
      .sort((a, b) => a.pct - b.pct),
    [formas, c],
  );
  const propio = results.find((r) => r.sede === c.result);
  // Los ejes cubren ambas sedes: al alternarlas se ve cómo se encoge el movimiento.
  const x = ejes([...formas.flatMap((f) => [f.hb, f.hb_hh]), ...results.map((r) => r.hb_arm)]);
  const y = ejes([...formas.flatMap((f) => [f.ivb, f.ivb_hh]), ...results.map((r) => r.ivb)]);

  return (
    <Panel
      ancho={7}
      className={className}
      titulo="¿Qué formas funcionan aquí?"
      meta={data ? `${fmt0(formas.length)} ${TIPO_PLURAL[tipo]} de la LMB; la estrella es el tuyo` : "Formas de la liga"}
      controles={
        <Segmentado
          etiqueta="Sede del mapa" valor={sede} onChange={setSede}
          opciones={(Object.keys(CAMPOS) as Sede[]).map((k) => ({ value: k, label: CAMPOS[k].label }))}
        />
      }
    >
      {error && <p className="pb text-sm text-grafito">No se pudo cargar el mapa: {error}.</p>}
      {!data && !error && <p className="pb py-16 text-center text-sm text-grafito motion-safe:animate-pulse">Cargando formas de la liga…</p>}
      {data && (
        <>
          <div className="pb">
            <div className="h-[340px] w-full" role="img" aria-label={`Mapa de movimiento de los ${TIPO_PLURAL[tipo]} de la LMB en ${c.label}`}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 6, right: 8, bottom: 22, left: -6 }}>
                  <CartesianGrid stroke="var(--linea)" />
                  <XAxis
                    type="number" dataKey="x" domain={x.domain} ticks={x.ticks} tick={EJE} stroke="var(--linea)" tickLine={false}
                    label={{ value: "Movimiento horizontal hacia el brazo (in)", position: "insideBottom", offset: -12, ...EJE }}
                  />
                  <YAxis
                    type="number" dataKey="y" domain={y.domain} ticks={y.ticks} width={40} tick={EJE} stroke="var(--linea)" tickLine={false}
                    label={{ value: "IVB (in)", angle: -90, position: "insideLeft", offset: 16, ...EJE }}
                  />
                  <ReferenceLine x={0} stroke="var(--grafito)" />
                  <ReferenceLine y={0} stroke="var(--grafito)" />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      const p = active ? (payload?.[0]?.payload as Punto | undefined) : undefined;
                      if (!p) return null;
                      return (
                        <div className="rounded-md border border-linea bg-papel px-2 py-1 text-xs">
                          <div className="font-semibold">
                            {p.propio ? "Lanzamiento capturado" : `Stuff+ ${fmtStuff(p.s)}, percentil ${fmt0(p.pct)} de su tipo`}
                          </div>
                          <div className="text-grafito">
                            IVB {fmt1(p.y)} in, HB {fmt1(p.x)} in{p.propio ? "" : `, ${fmt1(p.velo)} mph`}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={puntos} shape={Figura} isAnimationActive={false} />
                  {propio && (
                    <Scatter data={[{ x: propio.hb_arm, y: propio.ivb, s: propio.stuffPlus, pct: 0, velo: 0, propio: true }]} shape={Estrella} isAnimationActive={false} />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="ley">
            <span>Peor<span className="esc" aria-hidden="true" />mejor que el típico de su tipo en la sede</span>
            <span>◆ {100 - RESALTE_PCT}% más efectivo</span>
            <span>▫ {100 - RESALTE_PCT}% menos efectivo</span>
            <span>★ capturado</span>
          </div>
        </>
      )}
    </Panel>
  );
}
