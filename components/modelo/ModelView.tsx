"use client";

import {
  Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { WithData } from "@/components/DataProvider";
import { Card, CardTitle, Legend, PageIntro } from "@/components/ui";
import type { DashboardData } from "@/lib/data";
import { fmt0, fmt1, fmt2 } from "@/lib/format";
import { conResultados } from "@/types/resultados";
import { FieldMeaning } from "./FieldMeaning";
import { ProjectionCheck } from "./ProjectionCheck";

const MAIN = "#b91c1c";
const REF = "#a8a29e";
const AXIS = { fontSize: 12, fill: "#525252" };

/** Nombres legibles de las variables del modelo. */
const FEATURE_LABEL: Record<string, string> = {
  RelSpeed: "Velocidad",
  ivb: "IVB",
  hb_arm: "HB",
  SpinRate: "Giro",
  spin_axis_m: "Eje de giro",
  Extension: "Extensión",
  RelHeight: "Altura de liberación",
  rel_side_arm: "Lado de liberación",
  fb_relspeed: "Velocidad de la recta",
  fb_ivb: "IVB de la recta",
  d_velo: "Δ velocidad vs. recta",
  d_ivb: "Δ IVB vs. recta",
  d_hb: "Δ HB vs. recta",
  d_axis: "Δ eje vs. recta",
  alt: "Altitud",
};

/** Etiquetas de la escalera de modelos, por su clave (B1, B2…). */
const LADDER_LABEL: Record<string, string> = {
  B1: "Solo velocidad",
  B2: "+ movimiento y giro",
  B3: "+ liberación y arsenal",
  B4: "+ altitud (final)",
};

export function ModelView() {
  return (
    <WithData>
      {(data) => (
        <>
          <PageIntro title="Cómo se construyó la métrica">
            <p>
              Stuff+ califica qué tan difícil de batear es un lanzamiento solo por cómo sale de la mano y cómo se mueve.
              No mira dónde cayó ni qué pasó en la jugada. Estas son las piezas y las pruebas que la sostienen.
            </p>
          </PageIntro>
          <Steps data={data} />
          <FieldMeaning calibration={conResultados(data.meta).calibration} />
          <ProjectionCheck meta={conResultados(data.meta)} />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <SmallSample data={data} />
            <Ladder data={data} />
            <YearToYear data={data} />
            <Importance data={data} />
          </div>
        </>
      )}
    </WithData>
  );
}

function Steps({ data }: { data: DashboardData }) {
  const v = data.meta.validation;
  const steps = [
    {
      title: "Objetivo",
      text:
        "El valor en carreras de cada lanzamiento: cuánto cambió la expectativa de carreras al mover el conteo o terminar " +
        "el turno. Los valores de conteo y los pesos de eventos se calcularon con datos de la propia LMB, y los batazos se " +
        "valoran por su velocidad de salida y ángulo, no por dónde estaba el fildeador.",
    },
    {
      title: "Variables",
      text:
        `${fmt0(data.meta.features.length)} variables de “stuff”: velocidad, giro, eje, movimiento, punto de liberación y ` +
        "las diferencias contra la recta del mismo pitcher. No ve ubicación, conteo, bateador ni la etiqueta de tipo de " +
        "lanzamiento. Para zurdos, lo horizontal se expresa hacia el lado del brazo.",
    },
    {
      title: "Modelo",
      text:
        `Un modelo de árboles de decisión potenciados (LightGBM) con ${fmt0(data.model.trees.length)} árboles predice el ` +
        "valor de carrera esperado. El mismo modelo corre en tu navegador en el simulador.",
    },
    {
      title: "Escala",
      text:
        "Stuff+ = 100 + 10 × (promedio de la sede − valor predicho) ÷ desviación estándar de la sede, dentro de cada " +
        "categoría de altitud. 100 es el lanzamiento típico de la liga en ese tipo de sede; 110, una desviación estándar mejor.",
    },
    {
      title: "Validación",
      text:
        `Con pitchers que el modelo no vio, Stuff+ ordena el valor de carrera real con correlación ${fmt2(v.oof_corr)} ` +
        `(${fmt0(v.oof_n)} combinaciones pitcher × lanzamiento). Entrenando con temporadas anteriores y evaluando la ` +
        `siguiente: ${fmt2(v.temporal_corr)}; solo con pitchers debutantes: ${fmt2(v.temporal_new_corr)}.`,
    },
  ];
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((s, i) => (
        <li key={s.title} className="rounded-lg border border-neutral-200 bg-white p-4">
          <span className="text-xs font-semibold text-accent">Paso {i + 1}</span>
          <h2 className="mt-1 font-semibold text-neutral-900">{s.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

function SmallSample({ data }: { data: DashboardData }) {
  const rows = [...data.meta.validation.small_sample]
    .sort((a, b) => a.N - b.N)
    .map((s) => ({ ...s, name: `${fmt0(s.N)} lanz.` }));
  return (
    <Card>
      <CardTitle sub="Con una muestra de N lanzamientos de un pitcher, ¿qué predice mejor el resto de su temporada: su Stuff+ o su resultado real? Correlación con el valor de carrera posterior.">
        Stuff+ sirve desde los primeros lanzamientos
      </CardTitle>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 16, right: 4, bottom: 0, left: -16 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="name" tick={AXIS} stroke="#d4d4d4" />
            <YAxis tick={AXIS} stroke="#d4d4d4" domain={[0, "auto"]} tickFormatter={(v: number) => fmt1(v)} />
            <Tooltip
              cursor={{ fill: "#f5f5f5" }}
              formatter={(v, key) => [fmt2(Number(v)), key === "stuff" ? "Stuff+" : "Resultado real"]}
            />
            <Bar dataKey="stuff" fill={MAIN} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="stuff" position="top" formatter={(v) => fmt2(Number(v))} style={{ fontSize: 11, fill: "#404040" }} />
            </Bar>
            <Bar dataKey="rv" fill={REF} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="rv" position="top" formatter={(v) => fmt2(Number(v))} style={{ fontSize: 11, fill: "#404040" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[{ color: MAIN, label: "Stuff+" }, { color: REF, label: "Resultado real (valor de carrera)" }]} />
    </Card>
  );
}

function Ladder({ data }: { data: DashboardData }) {
  const rows = data.meta.validation.ladder
    .filter((l) => l.corr_pitcher_tipo != null)
    .map((l) => {
      const key = l.modelo.split(" ")[0];
      return { name: LADDER_LABEL[key] ?? l.modelo, v: l.corr_pitcher_tipo as number, final: key === "B4" };
    });
  return (
    <Card>
      <CardTitle sub="Correlación con el valor de carrera real en pitchers no vistos, agregando información sobre la forma del lanzamiento capa por capa.">
        Escalera de modelos
      </CardTitle>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }} barCategoryGap={8}>
            <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
            <XAxis type="number" domain={[0, "auto"]} tick={AXIS} stroke="#d4d4d4" tickFormatter={(v: number) => fmt1(v)} />
            <YAxis type="category" dataKey="name" width={120} tick={AXIS} stroke="#d4d4d4" />
            <Tooltip cursor={{ fill: "#f5f5f5" }} formatter={(v) => [fmt2(Number(v)), "Correlación"]} />
            <Bar dataKey="v" fill={MAIN} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="v" position="right" formatter={(v) => fmt2(Number(v))} style={{ fontSize: 11, fill: "#404040" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        La altitud casi no cambia el orden de los pitchers dentro de la liga, pero se conserva porque permite valorar
        distinto la misma forma según la sede, que es lo que necesita el simulador.
      </p>
    </Card>
  );
}

function YearToYear({ data }: { data: DashboardData }) {
  const rows = data.meta.validation.year_to_year;
  return (
    <Card>
      <CardTitle sub="Correlación de un mismo pitcher y lanzamiento entre una temporada y la siguiente. Una métrica estable mide una habilidad, no suerte.">
        Estabilidad año contra año
      </CardTitle>
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200 text-xs text-neutral-600">
          <tr>
            <th scope="col" className="py-2 pr-2 text-left font-medium">Temporadas</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">Pares</th>
            <th scope="col" className="px-2 py-2 text-right font-medium text-accent">Stuff+</th>
            <th scope="col" className="py-2 pl-2 text-right font-medium">Resultado real</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.par} className="border-b border-neutral-100 last:border-0">
              <td className="py-2 pr-2 text-neutral-900">{r.par.replace("->", " → ")}</td>
              <td className="px-2 py-2 text-right tabular-nums text-neutral-600">{fmt0(r.n)}</td>
              <td className="px-2 py-2 text-right text-lg font-semibold tabular-nums text-neutral-900">{fmt2(r.estab_stuff)}</td>
              <td className="py-2 pl-2 text-right tabular-nums text-neutral-700">{fmt2(r.estab_rv)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-neutral-500">
        El resultado real cambia mucho de un año a otro porque incluye ubicación, bateadores y azar; Stuff+ aísla lo que
        el pitcher controla con la forma de sus lanzamientos.
      </p>
    </Card>
  );
}

function Importance({ data }: { data: DashboardData }) {
  const rows = Object.entries(data.meta.validation.importance)
    .map(([k, v]) => ({ name: FEATURE_LABEL[k] ?? k, v }))
    .sort((a, b) => b.v - a.v);
  return (
    <Card>
      <CardTitle sub="Porcentaje de la mejora total del modelo que aporta cada variable. IVB y HB: movimiento vertical y horizontal; Δ: diferencia contra la recta del mismo pitcher.">
        Importancia de variables
      </CardTitle>
      <div className="h-[440px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }} barCategoryGap={3}>
            <XAxis type="number" hide domain={[0, "auto"]} />
            <YAxis type="category" dataKey="name" width={136} tick={{ fontSize: 12, fill: "#525252" }} stroke="#d4d4d4" interval={0} />
            <Tooltip cursor={{ fill: "#f5f5f5" }} formatter={(v) => [`${fmt1(Number(v))}%`, "Importancia"]} />
            <Bar dataKey="v" fill={MAIN} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="v" position="right" formatter={(v) => `${fmt1(Number(v))}%`} style={{ fontSize: 11, fill: "#404040" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
