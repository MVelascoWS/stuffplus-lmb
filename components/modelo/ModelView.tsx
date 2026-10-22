"use client";

import {
  Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useDashboardData } from "@/components/DataProvider";
import { Panel } from "@/components/consola/Panel";
import { Cargando, ErrorDatos, Vista } from "@/components/consola/Vista";
import type { DashboardData } from "@/lib/data";
import { fmt0, fmt1, fmt2 } from "@/lib/format";
import { conConvocatoria } from "@/types/convocatoria";
import { conResultados } from "@/types/resultados";
import { FieldMeaning } from "./FieldMeaning";
import { ProjectionCheck } from "./ProjectionCheck";
import { Validaciones } from "./Validaciones";

// Gráficas: serie principal en tinta y la comparación en grafito.
const MAIN = "var(--tinta)";
const REF = "var(--grafito)";
const AXIS = { fontSize: 11, fill: "var(--grafito)" };
const TITULO = "Modelo";
const DESCRIPCION = "Cómo se construyó Stuff+ y las pruebas que lo sostienen, con datos que el modelo no vio.";

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
  const estado = useDashboardData();
  if (estado.status !== "ready") {
    return (
      <Vista titulo={TITULO} descripcion={DESCRIPCION}>
        {estado.status === "error" ? <ErrorDatos mensaje={estado.message} /> : <Cargando />}
      </Vista>
    );
  }
  const data = estado.data;
  return (
    <Vista titulo={TITULO} descripcion={DESCRIPCION}>
      <Steps data={data} />
      <Validaciones meta={conConvocatoria(data.meta)} />
      <ProjectionCheck meta={conResultados(data.meta)} />
      <FieldMeaning calibration={conResultados(data.meta).calibration} />
      <div className="c5 grid min-w-0 gap-5">
        <Ladder data={data} />
        <YearToYear data={data} />
      </div>
      <SmallSample data={data} />
      <Shap data={data} />
    </Vista>
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
    <Panel ancho={12} titulo="Cómo se construyó la métrica" meta="Cinco pasos, en orden">
      <ol className="m-0 grid list-none p-0 md:grid-cols-5">
        {steps.map((st, i) => (
          <li key={st.title} className="relative border-b border-linea px-[18px] py-4 last:border-b-0 md:border-b-0 md:border-l md:first:border-l-0">
            <div className="flex items-center gap-3">
              <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tinta text-[20px] font-extrabold text-papel">{i + 1}</span>
              <h3 className="m-0 text-[15px] font-bold">{st.title}</h3>
              {i < steps.length - 1 && <span aria-hidden="true" className="ml-auto hidden text-grafito md:inline">→</span>}
            </div>
            <p className="m-0 mt-3 text-[13px] leading-relaxed text-grafito">{st.text}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function SmallSample({ data }: { data: DashboardData }) {
  const rows = [...data.meta.validation.small_sample]
    .sort((a, b) => a.N - b.N)
    .map((s) => ({ ...s, name: `${fmt0(s.N)} lanz.` }));
  return (
    <Panel ancho={5} titulo="Stuff+ sirve desde los primeros lanzamientos" meta="Correlación con el resto de la temporada, según cuántos lanzamientos se han visto">
      <div className="pb">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 16, right: 4, bottom: 0, left: -16 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="name" tick={AXIS} stroke="var(--linea)" />
            <YAxis tick={AXIS} stroke="var(--linea)" domain={[0, "auto"]} tickFormatter={(v: number) => fmt1(v)} />
            <Tooltip
              cursor={{ fill: "var(--lienzo)" }}
              formatter={(v, key) => [fmt2(Number(v)), key === "stuff" ? "Stuff+" : "Resultado real"]}
            />
            <Bar dataKey="stuff" fill={MAIN} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="stuff" position="top" formatter={(v) => fmt2(Number(v))} style={{ fontSize: 11, fill: "var(--tinta)" }} />
            </Bar>
            <Bar dataKey="rv" fill={REF} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="rv" position="top" formatter={(v) => fmt2(Number(v))} style={{ fontSize: 11, fill: "var(--tinta)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>
      <Leyenda items={[{ color: MAIN, label: "Stuff+" }, { color: REF, label: "Resultado real (valor de carrera)" }]} />
    </Panel>
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
    <Panel
      ancho={12}
      titulo="Escalera de modelos"
      meta="Correlación con el valor de carrera real en pitchers no vistos, capa por capa"
      pie="La altitud casi no cambia el orden de los pitchers dentro de la liga, pero se conserva porque permite valorar distinto la misma forma según la sede, que es lo que necesita el simulador."
    >
      <div className="pb">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }} barCategoryGap={8}>
            <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
            <XAxis type="number" domain={[0, "auto"]} tick={AXIS} stroke="var(--linea)" tickFormatter={(v: number) => fmt1(v)} />
            <YAxis type="category" dataKey="name" width={120} tick={AXIS} stroke="var(--linea)" />
            <Tooltip cursor={{ fill: "var(--lienzo)" }} formatter={(v) => [fmt2(Number(v)), "Correlación"]} />
            <Bar dataKey="v" fill={MAIN} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="v" position="right" formatter={(v) => fmt2(Number(v))} style={{ fontSize: 11, fill: "var(--tinta)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>
    </Panel>
  );
}

function YearToYear({ data }: { data: DashboardData }) {
  const rows = data.meta.validation.year_to_year;
  return (
    <Panel
      ancho={12}
      titulo="Estabilidad año contra año"
      meta="Mismo pitcher y lanzamiento, de una temporada a la siguiente"
      pie="El resultado real cambia mucho de un año a otro porque incluye ubicación, bateadores y azar; Stuff+ aísla lo que el pitcher controla con la forma de sus lanzamientos."
    >
      <table className="tabla">
        <thead>
          <tr>
            <th scope="col">Temporadas</th>
            <th scope="col" className="n">Pares</th>
            <th scope="col" className="n">Stuff+</th>
            <th scope="col" className="n">Resultado real</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.par}>
              <td>{r.par.replace("->", " → ")}</td>
              <td className="n tenue">{fmt0(r.n)}</td>
              <td className="n !text-[20px]">{fmt2(r.estab_stuff)}</td>
              <td className="n tenue">{fmt2(r.estab_rv)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/** Contribución de cada variable a la calificación (SHAP), sin la categoría de altitud. */
function Shap({ data }: { data: DashboardData }) {
  const rows = Object.entries(conConvocatoria(data.meta).robustez.shap.global)
    .filter(([k]) => k !== "alt")
    .map(([k, v]) => ({ name: FEATURE_LABEL[k] ?? k, v }))
    .sort((a, b) => b.v - a.v);
  return (
    <Panel
      ancho={7}
      titulo="Contribución de cada variable"
      meta="Puntos de Stuff+ que mueve en promedio cada variable (SHAP); Δ: diferencia contra la recta"
      pie="La categoría de altitud aporta sobre todo un cambio de nivel que la normalización por sede retira."
    >
      <div className="pb">
      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }} barCategoryGap={3}>
            <XAxis type="number" hide domain={[0, "auto"]} />
            <YAxis type="category" dataKey="name" width={136} tick={AXIS} stroke="var(--linea)" interval={0} />
            <Tooltip cursor={{ fill: "var(--lienzo)" }} formatter={(v) => [`${fmt1(Number(v))} puntos`, "Contribución promedio"]} />
            <Bar dataKey="v" fill={MAIN} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="v" position="right" formatter={(v) => fmt1(Number(v))} style={{ fontSize: 11, fill: "var(--tinta)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>
    </Panel>
  );
}

function Leyenda({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="ley">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
