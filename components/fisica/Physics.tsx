"use client";

import {
  Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { WithData } from "@/components/DataProvider";
import { Card, CardTitle, Legend, PageIntro } from "@/components/ui";
import type { DashboardMeta } from "@/lib/data";
import { TIPO_CORTO, TIPO_LABEL, fmt0, fmt2, fmtMeters, fmtPct, fmtSigned } from "@/lib/format";
import type { PitchType } from "@/lib/simulator";

const MAIN = "#b91c1c";
const REF = "#a8a29e";
const AXIS = { fontSize: 12, fill: "#525252" };

export function Physics() {
  return (
    <WithData>
      {({ meta }) => (
        <>
          <PageIntro title="Por qué la pelota se mueve menos en altitud">
            <p>
              La pelota se curva porque su giro empuja el aire. En las sedes de altitud extrema hay menos aire que
              empujar y el lanzamiento pierde movimiento. Aquí se mide cuánto pierde cada tipo, por qué pierde más de lo
              que la densidad del aire explicaría por sí sola y qué tan bien se sostiene esa ley fuera de la muestra.
            </p>
          </PageIntro>
          <Conclusions meta={meta} />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <LossChart meta={meta} />
            <ProjectionChart meta={meta} />
          </div>
          <ExponentTable meta={meta} />
        </>
      )}
    </WithData>
  );
}

function Conclusions({ meta }: { meta: DashboardMeta }) {
  const { physics, perdida_mov_tipo: p } = meta;
  const items = [
    {
      title: "El sensor está bien calibrado",
      text:
        "Lo que pone la mano del pitcher (velocidad, extensión, altura de liberación y giro) prácticamente no cambia " +
        "entre sedes. La pérdida de movimiento no es un error de medición.",
    },
    {
      title: "El tiempo de vuelo no explica la pérdida",
      text:
        "Con menos arrastre la pelota llega antes, lo que le daría menos tiempo para moverse, pero también llega más " +
        "rápido, y la fuerza que la curva crece con la velocidad. Un simulador de trayectoria muestra que ambos efectos " +
        "se cancelan.",
    },
    {
      title: "La pelota “muerde” menos el aire",
      text:
        `La fuerza que curva la pelota cae como la densidad elevada a ${fmt2(physics.p_magnus_global)}, no en ` +
        `proporción directa; el arrastre, como la densidad a ${fmt2(physics.p_drag_global)}. La densidad sola explica ` +
        `${fmt0(p.densidad_sola_explica_pct)}% de la pérdida de movimiento; con esta ley, ${fmt0(p.modelo_fisico_explica_pct)}%.`,
    },
  ];
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {items.map((it, i) => (
        <li key={it.title} className="rounded-lg border border-neutral-200 bg-white p-4">
          <span className="text-xs font-semibold text-accent">{i + 1}</span>
          <h2 className="mt-1 font-semibold text-neutral-900">{it.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">{it.text}</p>
        </li>
      ))}
    </ol>
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
    <Card>
      <CardTitle
        sub={`Mismo pitcher y mismo lanzamiento: altitud extrema (promedio ${fmtMeters(ext.h)}) contra sin altitud (${fmtMeters(mar.h)}).`}
      >
        Movimiento perdido por tipo de lanzamiento
      </CardTitle>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }} barCategoryGap={6}>
            <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
            <XAxis type="number" domain={[lo, 0]} tick={AXIS} stroke="#d4d4d4" tickFormatter={(v: number) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={64} tick={AXIS} stroke="#d4d4d4" />
            <Tooltip
              cursor={{ fill: "#f5f5f5" }}
              formatter={(v) => [fmtPct(Number(v)), "Pérdida observada"]}
              labelFormatter={(_, payload) => TIPO_LABEL[(payload?.[0]?.payload as { tipo: PitchType })?.tipo] ?? ""}
            />
            <Bar dataKey="v" fill={MAIN} radius={[4, 0, 0, 4]} isAnimationActive={false}>
              <LabelList dataKey="v" position="insideLeft" formatter={(v) => fmtPct(Number(v))} style={{ fill: "#fff", fontSize: 11 }} />
            </Bar>
            <ReferenceLine x={lineal_densidad} stroke={REF} strokeWidth={2} strokeDasharray="4 3" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          { color: MAIN, label: "Pérdida observada" },
          { color: REF, label: `Si fuera proporcional a la densidad (${fmtPct(lineal_densidad)})` },
        ]}
      />
    </Card>
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
    <Card>
      <CardTitle sub="Cambio de Stuff+ relativo: lo que proyecta la física al llevar los lanzamientos de nivel del mar al Harp Helú, contra lo que pasó a los mismos pitchers en altitud extrema.">
        La proyección coincide con lo observado
      </CardTitle>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }} barCategoryGap={8} barGap={2}>
            <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
            <XAxis type="number" domain={[-lim, lim]} ticks={ticks} tick={AXIS} stroke="#d4d4d4" />
            <YAxis type="category" dataKey="name" width={64} tick={AXIS} stroke="#d4d4d4" />
            <ReferenceLine x={0} stroke="#737373" />
            <Tooltip
              cursor={{ fill: "#f5f5f5" }}
              formatter={(v, key) => [fmtSigned(Number(v), 1), key === "proyectado" ? "Proyectado" : "Observado"]}
              labelFormatter={(_, payload) => {
                const r = payload?.[0]?.payload as (typeof rows)[number] | undefined;
                return r ? `${TIPO_LABEL[r.tipo]} · ${fmt0(r.n ?? 0)} pitchers observados` : "";
              }}
            />
            <Bar dataKey="proyectado" fill={MAIN} radius={4} isAnimationActive={false} />
            <Bar dataKey="observado" fill={REF} radius={4} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[{ color: MAIN, label: "Proyectado al Harp Helú" }, { color: REF, label: "Observado en altitud extrema" }]} />
    </Card>
  );
}

function ExponentTable({ meta }: { meta: DashboardMeta }) {
  const { p_magnus_tipo, ic95_tipo, valida_medium } = meta.physics;
  const medium = meta.sedes["Medium Altitude"];
  const rows = (Object.entries(p_magnus_tipo) as [PitchType, number][]).sort((a, b) => b[1] - a[1]);
  const validated = rows.filter(([t]) => valida_medium[t]).length;
  return (
    <Card className="mt-6">
      <CardTitle
        sub={`Cada exponente se estimó solo con las sedes de altitud extrema y, sin reajustar nada, se usó para predecir las de altitud media (${fmtMeters(medium.h)}). ${validated} de ${rows.length} tipos aciertan dentro de su intervalo de confianza.`}
      >
        La ley por tipo de lanzamiento, validada fuera de muestra
      </CardTitle>
      <div data-scroll-x className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-xs text-neutral-600">
            <tr>
              <th scope="col" className="py-2 pr-2 text-left font-medium">Lanzamiento</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Exponente <span className="font-normal text-neutral-500">(IC 95%)</span>
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">Predicción en altitud media</th>
              <th scope="col" className="py-2 pl-2 text-right font-medium">¿Validó?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([tipo, p]) => {
              const [a, b] = ic95_tipo[tipo];
              return (
                <tr key={tipo} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2 pr-2 text-neutral-900">{TIPO_LABEL[tipo]}</td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    <span className="font-semibold">{fmt2(p)}</span>
                    <span className="block whitespace-nowrap text-xs text-neutral-500 sm:ml-1 sm:inline">({fmt2(a)} – {fmt2(b)})</span>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtPct(100 * (Math.pow(medium.rho_ratio, p) - 1))}</td>
                  <td className="py-2 pl-2 text-right">
                    {valida_medium[tipo] ? <span className="text-neutral-900">Sí</span> : <span className="font-medium text-accent">No</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Exponente: la fuerza que curva la pelota cae como (densidad de la sede ÷ densidad a nivel del mar) elevada a este
        número; si fuera proporcional a la densidad, valdría 1. Predicción: movimiento perdido en altitud media frente a nivel del mar.
      </p>
    </Card>
  );
}
