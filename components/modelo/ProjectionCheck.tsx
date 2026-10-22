"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Lectura, Panel } from "@/components/consola/Panel";
import { TIPO_LABEL, fmt0, fmt1, fmt2, fmtMeters, fmtSigned } from "@/lib/format";
import type { PitchType } from "@/lib/simulator";
import type { MetaConResultados } from "@/types/resultados";

const MAIN = "var(--tinta)";
const REF = "var(--grafito)";
const AXIS = { fontSize: 11, fill: "var(--grafito)" };

/** Ancla para enlazar esta sección desde otras vistas. */
export const PROJECTION_ANCHOR = "validacion-proyeccion";

/** Barras horizontales con una etiqueta por fila; el color distingue la referencia del simulador. */
function HBars({ rows, digits, max }: { rows: { name: string; v: number; main: boolean }[]; digits: number; max?: number }) {
  return (
    <div className="w-full" style={{ height: 44 * rows.length + 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide domain={[0, max ?? "auto"]} />
          <YAxis type="category" dataKey="name" width={150} tick={AXIS} stroke="#d4d4d4" interval={0} />
          <Tooltip cursor={{ fill: "#f5f5f5" }} formatter={(v) => [digits === 1 ? fmt1(Number(v)) : fmt2(Number(v)), ""]} separator="" />
          <Bar dataKey="v" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {rows.map((r) => <Cell key={r.name} fill={r.main ? MAIN : REF} />)}
            <LabelList
              dataKey="v" position="right"
              formatter={(v) => (digits === 1 ? fmt1(Number(v)) : fmt2(Number(v)))}
              style={{ fontSize: 12, fill: "#262626", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** ¿El simulador anticipa cómo rinde en altitud un pitcher que el modelo nunca vio? */
export function ProjectionCheck({ meta }: { meta: MetaConResultados }) {
  const v = meta.projection_validation;
  const real = v.vs_resultado_real;
  const ext = meta.sedes["Extreme Altitude"];
  const [lo, hi] = v.reduccion_error_ic95;
  const tipos = Object.entries(v.por_tipo).sort((a, b) => b[1].n - a[1].n) as [PitchType, (typeof v.por_tipo)[string]][];

  return (
    <Panel
      ancho={12}
      id={PROJECTION_ANCHOR}
      className="scroll-mt-24"
      titulo="¿El simulador predice cómo rinde un pitcher en altitud?"
      meta={`${fmt0(v.n_pitchers)} pitchers que el modelo nunca vio`}
      pie={<>“Igual”: suponer que el pitcher rinde en altitud lo mismo que a nivel del mar. El modelo de Stuff+ nunca vio a estos pitchers; los exponentes físicos (uno por tipo de lanzamiento) sí se estimaron con todos. Las correlaciones contra el resultado real son menores que contra Stuff+ porque el resultado incluye ubicación, bateador y azar.</>}
    >
      <Lectura>
        Con solo sus lanzamientos a nivel del mar, el simulador anticipa el rendimiento de un pitcher en altitud tan bien
        como si ya lo hubiéramos visto lanzar allá.
      </Lectura>
      <div className="pb">
      <p className="m-0 max-w-3xl text-[14px] leading-relaxed">
        Tomamos a {fmt0(v.n_pitchers)} pitchers que lanzaron el mismo tipo de lanzamiento a nivel del mar y en altitud
        extrema ({fmt0(v.n)} combinaciones pitcher × lanzamiento). Para cada uno se entrenó el modelo sin ese pitcher:{" "}
        <strong className="font-semibold">el modelo nunca lo vio</strong>. Sus lanzamientos a nivel del mar se trasladaron
        a la altitud promedio de las sedes extremas ({fmtMeters(ext.h)}) y la proyección se comparó con lo que realmente
        pasó allá.
      </p>

      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold ">Error medio al anticipar su Stuff+ en altitud</h3>
          <p className="mb-3 text-xs text-grafito">Puntos de Stuff+; menos es mejor.</p>
          <HBars
            digits={1}
            rows={[
              { name: "Suponer que rinde igual", v: v.ingenuo.mae, main: false },
              { name: "Simulador", v: v.proyeccion.mae, main: true },
            ]}
          />
          <p className="mt-3 text-sm ">
            <strong>{fmt0(v.reduccion_error_pct)}% menos error</strong> (intervalo de 95%:{" "}
            {fmt0(lo)}% a {fmt0(hi)}%). Además anticipa cuánto sube o baja cada pitcher: el cambio proyectado y el
            observado tienen correlación {fmt2(v.cambio_corr)}.
          </p>
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold ">Contra el resultado real</h3>
          <p className="mb-3 text-xs text-grafito">
            Correlación con las carreras que esos lanzamientos realmente permitieron en altitud; más es mejor.
          </p>
          <HBars
            digits={2}
            rows={[
              { name: "Stuff+ a nivel del mar", v: real.ingenuo, main: false },
              { name: "Proyección del simulador", v: real.proyeccion, main: true },
              { name: "Stuff+ ya medido en altitud", v: real.techo, main: false },
            ]}
          />
          <p className="mt-3 text-sm ">
            La proyección iguala al Stuff+ de los lanzamientos que de hecho tiraron en altitud, el techo de esta prueba.
            La mejora sobre suponer que rinde igual es significativa (intervalo de 95%: {fmtSigned(real.mejora_ic95[0], 3)} a{" "}
            {fmtSigned(real.mejora_ic95[1], 3)}).
          </p>
        </div>
      </div>

      <h3 className="mt-8 text-sm font-semibold ">La mejora se sostiene en todos los tipos</h3>
      <div data-scroll-x className="mt-2 overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Lanzamiento</th>
              <th scope="col" className="n">Comb.</th>
              <th scope="col" className="n">
                Error <span className="block font-normal sm:inline">igual → simulador</span>
              </th>
              <th scope="col" className="n">
                Correlación <span className="block font-normal sm:inline">igual → simulador</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tipos.map(([tipo, t]) => (
              <tr key={tipo}>
                <td>{TIPO_LABEL[tipo] ?? tipo}</td>
                <td className="n tenue">{fmt0(t.n)}</td>
                <td className="n whitespace-nowrap">
                  <span className="text-grafito">{fmt1(t.ingenuo.mae)}</span> → <strong className="font-semibold">{fmt1(t.proyeccion.mae)}</strong>
                </td>
                <td className="n whitespace-nowrap">
                  <span className="text-grafito">{fmt2(t.ingenuo.corr)}</span> → <strong className="font-semibold">{fmt2(t.proyeccion.corr)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      </div>
    </Panel>
  );
}
