"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { useJson } from "@/components/useJson";
import { Card, CardTitle } from "@/components/ui";
import { TIPO_LABEL, fmt0, fmt1, fmtStuff } from "@/lib/format";
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

// Escala divergente: azul bajo el promedio, gris neutro en 100 y el rojo del sitio arriba.
const BAJO = [37, 99, 235], MEDIO = [212, 212, 212], ALTO = [185, 28, 28];
const mezcla = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
const color = (s: number, amplitud: number) => {
  const t = Math.max(-1, Math.min(1, (s - 100) / amplitud));
  return t >= 0 ? mezcla(MEDIO, ALTO, t) : mezcla(MEDIO, BAJO, -t);
};

/** El lanzamiento capturado: una estrella más grande que los puntos de la liga, con borde blanco. */
function Estrella({ cx = 0, cy = 0 }: { cx?: number; cy?: number }) {
  const r = 11, ri = r * 0.45;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? ri : r;
    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={pts} fill="#171717" stroke="#fff" strokeWidth={1.5} />;
}

interface Punto { x: number; y: number; s: number; pct: number; velo: number; fill: string }

function ejes(valores: number[]): { domain: [number, number]; ticks: number[] } {
  const lo = Math.floor((Math.min(0, ...valores) - 1) / 5) * 5;
  const hi = Math.ceil((Math.max(0, ...valores) + 1) / 5) * 5;
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += 5) ticks.push(v);
  return { domain: [lo, hi], ticks };
}

/** "¿Qué formas funcionan aquí?": las formas de la liga del mismo tipo, coloreadas por Stuff+. */
export function MovementMap({ tipo, results }: { tipo: PitchType; results: SedeResult[] }) {
  const { data, error } = useJson<MapData>("movement_map.json");
  const [sede, setSede] = useState<Sede>("hh");

  const formas = useMemo(() => data?.formas.filter((f) => f.tipo === tipo) ?? [], [data, tipo]);
  // La amplitud del color y los ejes se calculan con ambas sedes, para que no cambien al alternarlas.
  const amplitud = useMemo(() => {
    const d = formas.flatMap((f) => [Math.abs(f.s_mar - 100), Math.abs(f.s_hh - 100)]).sort((a, b) => a - b);
    return Math.max(1, Math.ceil(d[Math.floor(0.95 * (d.length - 1))] ?? 1));
  }, [formas]);
  const propio = results.find((r) => r.sede === CAMPOS[sede].result);
  const x = ejes([...formas.flatMap((f) => [f.hb, f.hb_hh]), ...results.map((r) => r.hb_arm)]);
  const y = ejes([...formas.flatMap((f) => [f.ivb, f.ivb_hh]), ...results.map((r) => r.ivb)]);

  const c = CAMPOS[sede];
  const puntos = (filtro: (pct: number) => boolean): Punto[] =>
    formas
      .filter((f) => filtro(f[c.pct] as number))
      .map((f) => {
        const s = f[c.s] as number;
        return { x: f[c.hb] as number, y: f[c.ivb] as number, s, pct: f[c.pct] as number, velo: f.velo, fill: color(s, amplitud) };
      });
  const resto = puntos((p) => p > 100 - RESALTE_PCT && p < RESALTE_PCT);
  const mejores = puntos((p) => p >= RESALTE_PCT);
  const peores = puntos((p) => p <= 100 - RESALTE_PCT);

  return (
    <Card>
      <CardTitle
        sub={`Cada punto es la forma promedio de un pitcher de la LMB con ${TIPO_LABEL[tipo].toLowerCase()}, coloreada por su Stuff+ en la sede elegida. La estrella es el lanzamiento capturado.`}
      >
        ¿Qué formas funcionan aquí?
      </CardTitle>

      <div role="group" aria-label="Sede del mapa" className="mb-3 inline-flex rounded border border-neutral-300 bg-white p-0.5 text-sm">
        {(Object.keys(CAMPOS) as Sede[]).map((k) => (
          <button
            key={k} type="button" aria-pressed={sede === k} onClick={() => setSede(k)}
            className={`rounded px-3 py-1 ${sede === k ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
          >
            {CAMPOS[k].label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-neutral-600">No se pudo cargar el mapa: {error}.</p>}
      {!data && !error && <p className="animate-pulse py-16 text-center text-sm text-neutral-500">Cargando formas de la liga…</p>}
      {data && (
        <>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" />
                <XAxis
                  type="number" dataKey="x" domain={x.domain} ticks={x.ticks} tick={{ fontSize: 12, fill: "#737373" }} stroke="#d4d4d4"
                  label={{ value: "HB hacia el brazo (in)", position: "insideBottom", offset: -14, fontSize: 12, fill: "#525252" }}
                />
                <YAxis
                  type="number" dataKey="y" domain={y.domain} ticks={y.ticks} width={40} tick={{ fontSize: 12, fill: "#737373" }} stroke="#d4d4d4"
                  label={{ value: "IVB (in)", angle: -90, position: "insideLeft", offset: 12, fontSize: 12, fill: "#525252" }}
                />
                <ZAxis range={[36, 36]} />
                <ReferenceLine x={0} stroke="#a3a3a3" />
                <ReferenceLine y={0} stroke="#a3a3a3" />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    const p = active ? (payload?.[0]?.payload as (Punto & { propio?: boolean }) | undefined) : undefined;
                    if (!p) return null;
                    return (
                      <div className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs shadow-sm">
                        <div className="font-medium text-neutral-900">
                          {p.propio ? "Lanzamiento capturado" : `Stuff+ ${fmtStuff(p.s)} · percentil ${fmt0(p.pct)} de su tipo`}
                        </div>
                        <div className="text-neutral-600">
                          IVB {fmt1(p.y)} in · HB {fmt1(p.x)} in{p.propio ? "" : ` · ${fmt1(p.velo)} mph`}
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter data={resto} isAnimationActive={false} fillOpacity={0.75}>
                  {resto.map((p, i) => <Cell key={i} fill={p.fill} />)}
                </Scatter>
                <Scatter data={peores} shape="diamond" isAnimationActive={false} stroke="#737373" strokeWidth={1.5}>
                  {peores.map((p, i) => <Cell key={i} fill={p.fill} />)}
                </Scatter>
                <Scatter data={mejores} isAnimationActive={false} stroke="#171717" strokeWidth={1.5}>
                  {mejores.map((p, i) => <Cell key={i} fill={p.fill} />)}
                </Scatter>
                {propio && (
                  <Scatter
                    data={[{ x: propio.hb_arm, y: propio.ivb, propio: true }]} shape={Estrella} isAnimationActive={false}
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-col gap-3 text-xs text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div
                className="h-2.5 w-48 max-w-full rounded-sm"
                style={{ background: `linear-gradient(to right, ${color(100 - amplitud, amplitud)}, ${color(100, amplitud)}, ${color(100 + amplitud, amplitud)})` }}
              />
              <div className="flex w-48 max-w-full justify-between tabular-nums">
                <span>{fmt0(100 - amplitud)}</span><span>Stuff+ 100</span><span>{fmt0(100 + amplitud)}</span>
              </div>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full border-[1.5px] border-neutral-900 bg-neutral-200" />
                {100 - RESALTE_PCT}% más efectivo de su tipo
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rotate-45 border-[1.5px] border-neutral-500 bg-neutral-200" />
                {100 - RESALTE_PCT}% menos efectivo
              </li>
              <li className="flex items-center gap-1.5"><span aria-hidden className="text-sm leading-none text-neutral-900">★</span> Capturado</li>
            </ul>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {fmt0(formas.length)} formas de la liga, medidas a nivel del mar; en el Harp Helú, trasladadas con la ley física
            y calificadas de nuevo.
          </p>
        </>
      )}
    </Card>
  );
}
