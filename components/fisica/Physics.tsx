"use client";

import {
  Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useDashboardData } from "@/components/DataProvider";
import { Panel } from "@/components/consola/Panel";
import { Cargando, ErrorDatos, Vista } from "@/components/consola/Vista";
import type { DashboardMeta } from "@/lib/data";
import { TIPO_CORTO, TIPO_LABEL, fmt0, fmt2, fmtMeters, fmtPct, fmtSigned } from "@/lib/format";
import type { PitchType } from "@/lib/simulator";
import { conConvocatoria } from "@/types/convocatoria";
import { Contacto } from "./Contacto";
import { Hipotesis } from "./Hipotesis";
import { Rodados } from "./Rodados";

// Gráficas: serie principal en tinta, el Harp Helú en rojo y la comparación en grafito.
const TINTA = "var(--tinta)";
const ROJO = "var(--rojo)";
const GRAFITO = "var(--grafito)";
const EJE = { fontSize: 11, fill: "var(--grafito)" };
const TITULO = "Física";
const DESCRIPCION = "Por qué la pelota se mueve menos en altitud: las hipótesis de la convocatoria y la ley que lo explica.";

export function Physics() {
  const estado = useDashboardData();
  if (estado.status !== "ready") {
    return (
      <Vista titulo={TITULO} descripcion={DESCRIPCION}>
        {estado.status === "error" ? <ErrorDatos mensaje={estado.message} /> : <Cargando />}
      </Vista>
    );
  }
  const { meta } = estado.data;
  return (
    <Vista titulo={TITULO} descripcion={DESCRIPCION}>
      <Hipotesis meta={conConvocatoria(meta)} />
      <LossChart meta={meta} />
      <ProjectionChart meta={meta} />
      <ExponentTable meta={meta} />
      <Verificaciones meta={meta} />
      <Contacto meta={conConvocatoria(meta)} />
      <Rodados meta={conConvocatoria(meta)} />
    </Vista>
  );
}

function Leyenda({ items }: { items: { color: string; label: string; linea?: boolean }[] }) {
  return (
    <div className="ley">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={i.linea ? "inline-block w-4 border-t-2 border-dashed" : "inline-block h-2.5 w-2.5 rounded-sm"}
            style={i.linea ? { borderColor: i.color } : { background: i.color }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Verificaciones({ meta }: { meta: DashboardMeta }) {
  const { physics, perdida_mov_tipo: p } = meta;
  const items = [
    {
      titulo: "El sensor está bien calibrado",
      texto:
        "Lo que pone la mano del pitcher (velocidad, extensión, altura de liberación y giro) prácticamente no cambia " +
        "entre sedes. La pérdida de movimiento no es un error de medición.",
    },
    {
      titulo: "El tiempo de vuelo no explica la pérdida",
      texto:
        "Con menos arrastre la pelota llega antes, lo que le daría menos tiempo para moverse, pero también llega más " +
        "rápido, y la fuerza que la curva crece con la velocidad. Un simulador de trayectoria muestra que ambos efectos " +
        "se cancelan.",
    },
    {
      titulo: "La pelota “muerde” menos el aire",
      texto:
        `La fuerza que curva la pelota cae como la densidad elevada a ${fmt2(physics.p_magnus_global)}, no en ` +
        `proporción directa; el arrastre, como la densidad a ${fmt2(physics.p_drag_global)}. La densidad sola explica ` +
        `${fmt0(p.densidad_sola_explica_pct)}% de la pérdida de movimiento; con esta ley, ${fmt0(p.modelo_fisico_explica_pct)}%.`,
    },
  ];
  return (
    <Panel ancho={5} titulo="Tres verificaciones" meta="Antes de creerle a la pérdida de movimiento">
      <ol className="m-0 list-none p-0">
        {items.map((it, i) => (
          <li key={it.titulo} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2 border-b border-linea px-[18px] py-3 last:border-b-0">
            <span className="num text-[22px] font-extrabold leading-none">{i + 1}</span>
            <div>
              <h3 className="m-0 text-[14px] font-bold">{it.titulo}</h3>
              <p className="m-0 mt-1 text-[13px] text-grafito">{it.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function LossChart({ meta }: { meta: DashboardMeta }) {
  const { observado, lineal_densidad } = meta.perdida_mov_tipo;
  const rows = (Object.entries(observado) as [PitchType, number][])
    .map(([tipo, v]) => ({ tipo, name: TIPO_CORTO[tipo], v }))
    .sort((a, b) => a.v - b.v);
  const lo = Math.floor(Math.min(...rows.map((r) => r.v), lineal_densidad) / 5) * 5 - 5;
  const ext = meta.sedes["Extreme Altitude"], mar = meta.sedes["No Altitude"];
  return (
    <Panel
      ancho={6}
      titulo="Pérdida de movimiento por tipo"
      meta={`Mismo pitcher y lanzamiento: altitud extrema (${fmtMeters(ext.h)}) contra sin altitud (${fmtMeters(mar.h)})`}
    >
      <div className="pb">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke="var(--linea)" />
              <XAxis type="number" domain={[lo, 0]} tick={EJE} stroke="var(--linea)" tickFormatter={(v: number) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={64} tick={EJE} stroke="var(--linea)" />
              <Tooltip
                cursor={{ fill: "var(--lienzo)" }}
                formatter={(v) => [fmtPct(Number(v)), "Pérdida observada"]}
                labelFormatter={(_, payload) => TIPO_LABEL[(payload?.[0]?.payload as { tipo: PitchType })?.tipo] ?? ""}
              />
              <Bar dataKey="v" fill={TINTA} radius={[4, 0, 0, 4]} isAnimationActive={false}>
                <LabelList dataKey="v" position="insideLeft" formatter={(v) => fmtPct(Number(v))} style={{ fill: "#fff", fontSize: 11 }} />
              </Bar>
              <ReferenceLine x={lineal_densidad} stroke={GRAFITO} strokeWidth={2} strokeDasharray="4 3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <Leyenda
        items={[
          { color: TINTA, label: "Pérdida observada" },
          { color: GRAFITO, label: `Si fuera proporcional a la densidad (${fmtPct(lineal_densidad)})`, linea: true },
        ]}
      />
    </Panel>
  );
}

function ProjectionChart({ meta }: { meta: DashboardMeta }) {
  const observed = new Map(meta.delta_tipo_observado.map((o) => [o.tipo, o]));
  const rows = [...meta.delta_tipo_proyectado]
    .sort((a, b) => b.delta - a.delta)
    .map((d) => ({ tipo: d.tipo, name: TIPO_CORTO[d.tipo], proyectado: d.delta, observado: observed.get(d.tipo)?.mean ?? null, n: observed.get(d.tipo)?.size }));
  const vals = rows.flatMap((r) => [r.proyectado, r.observado ?? 0]);
  const lim = Math.ceil(Math.max(...vals.map(Math.abs)) / 4) * 4;
  const ticks: number[] = [];
  for (let v = -lim; v <= lim; v += 4) ticks.push(v);
  return (
    <Panel ancho={6} titulo="La proyección coincide con lo observado" meta="Cambio de Stuff+ relativo al pasar a altitud, por tipo">
      <div className="pb">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }} barCategoryGap={8} barGap={2}>
              <CartesianGrid horizontal={false} stroke="var(--linea)" />
              <XAxis type="number" domain={[-lim, lim]} ticks={ticks} tick={EJE} stroke="var(--linea)" />
              <YAxis type="category" dataKey="name" width={64} tick={EJE} stroke="var(--linea)" />
              <ReferenceLine x={0} stroke={GRAFITO} />
              <Tooltip
                cursor={{ fill: "var(--lienzo)" }}
                formatter={(v, key) => [fmtSigned(Number(v), 1), key === "proyectado" ? "Proyectado" : "Observado"]}
                labelFormatter={(_, payload) => {
                  const r = payload?.[0]?.payload as (typeof rows)[number] | undefined;
                  return r ? `${TIPO_LABEL[r.tipo]}, ${fmt0(r.n ?? 0)} pitchers observados` : "";
                }}
              />
              <Bar dataKey="proyectado" fill={ROJO} radius={4} isAnimationActive={false} />
              <Bar dataKey="observado" fill={GRAFITO} radius={4} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <Leyenda items={[{ color: ROJO, label: "Proyectado al Harp Helú" }, { color: GRAFITO, label: "Observado en altitud extrema" }]} />
    </Panel>
  );
}

function ExponentTable({ meta }: { meta: DashboardMeta }) {
  const { p_magnus_tipo, ic95_tipo, valida_medium } = meta.physics;
  const medium = meta.sedes["Medium Altitude"];
  const rows = (Object.entries(p_magnus_tipo) as [PitchType, number][]).sort((a, b) => b[1] - a[1]);
  const validated = rows.filter(([t]) => valida_medium[t]).length;
  return (
    <Panel
      ancho={7}
      titulo="Exponentes por tipo, validados fuera de muestra"
      meta={`Estimados en altitud extrema y usados sin reajuste para predecir la altitud media (${fmtMeters(medium.h)}): ${validated} de ${rows.length} aciertan`}
      pie="Exponente: la fuerza que curva la pelota cae como (densidad de la sede ÷ densidad a nivel del mar) elevada a este número; si fuera proporcional a la densidad, valdría 1. Predicción: movimiento perdido en altitud media frente a nivel del mar."
    >
      <div data-scroll-x className="overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Lanzamiento</th>
              <th scope="col" className="n">Exponente (IC 95%)</th>
              <th scope="col" className="n">Predicción en altitud media</th>
              <th scope="col" className="n">¿Validó?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([tipo, p]) => {
              const [a, b] = ic95_tipo[tipo];
              return (
                <tr key={tipo}>
                  <td>{TIPO_LABEL[tipo]}</td>
                  <td className="n">
                    {fmt2(p)}
                    <span className="tenue ml-1 block whitespace-nowrap text-xs sm:inline">({fmt2(a)} – {fmt2(b)})</span>
                  </td>
                  <td className="n">{fmtPct(100 * (Math.pow(medium.rho_ratio, p) - 1))}</td>
                  <td className="text-right">
                    <span className={`chip ${valida_medium[tipo] ? "confirmada" : "nc"}`}>{valida_medium[tipo] ? "Sí" : "No"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
