import Link from "next/link";
import type { ReactNode } from "react";
import { Panel } from "@/components/consola/Panel";
import { fmt0, fmt2, fmtPct, fmtSigned } from "@/lib/format";
import type { MetaConvocatoria } from "@/types/convocatoria";

const Seccion = ({ n }: { n: string }) => (
  <Link href="/reporte/" className="font-semibold underline underline-offset-2">sección {n}</Link>
);

/** Estados de docs/diseno.md: en negro lo confirmado, con borde lo respaldado. El rojo no se usa para estados. */
type Estado = "confirmada" | "respaldada" | "nc";

/** Las cuatro hipótesis de la convocatoria, una por panel, en los mismos términos que el reporte técnico. */
export function Hipotesis({ meta }: { meta: MetaConvocatoria }) {
  const perdida = meta.perdida_mov_tipo;
  const cambio = <T extends { tipo: string }>(xs: T[]) => xs.find((x) => x.tipo === "Changeup") as T;
  const proy = cambio(meta.delta_tipo_proyectado);
  const obs = cambio(meta.delta_tipo_observado);
  const hrCambio = cambio(meta.contacto.por_tipo);
  const { elevado_menos_rodado: em, corr_rodados_vs_carreras: cr } = meta.contacto.h3;
  // Lugar del giro entre las variables físicas por contribución SHAP (la categoría de altitud no cuenta).
  const fisicas = Object.entries(meta.robustez.shap.global).filter(([k]) => k !== "alt").sort((a, b) => b[1] - a[1]);
  const lugarGiro = fisicas.findIndex(([k]) => k === "SpinRate") + 1;

  const filas: { h: string; chip: string; estado: Estado; veredicto: string; texto: ReactNode }[] = [
    {
      h: "H1. La baja densidad reduce el movimiento inducido por giro",
      chip: "Confirmada", estado: "confirmada",
      veredicto: "Confirmada y más fuerte de lo esperado:",
      texto: (
        <>
          {fmtPct(perdida.observado_promedio)} de movimiento contra {fmtPct(perdida.lineal_densidad)} que predice la
          densidad sola; la fuerza que curva la pelota cae como densidad<sup>{fmt2(meta.physics.p_magnus_global)}</sup> (<Seccion n="6" />).
        </>
      ),
    },
    {
      h: "H2. Los lanzamientos de diferencial de velocidad (cambio) mantienen o ganan Stuff+",
      chip: "Se mantiene", estado: "respaldada",
      veredicto: "Se mantiene, no gana:",
      texto: (
        <>
          el cambio es el que más movimiento pierde ({fmtPct(perdida.observado.Changeup)}), pero su recta pierde también
          y su Stuff+ relativo queda estable ({fmtSigned(proy.delta, 1)} proyectado, {fmtSigned(obs.mean, 1)} observado).
          Cuando lo batean, su riesgo de jonrón sube {fmtSigned(hrCambio.hr_riesgo_pct, 0)}%.
        </>
      ),
    },
    {
      h: "H3. Los pitchers de rodados valen más en altitud",
      chip: "Respaldada", estado: "respaldada",
      veredicto: "Respaldada:",
      texto: (
        <>
          un elevado cuesta {fmt2(em.extrema)} carreras más que un rodado en altitud extrema contra {fmt2(em.mar)} a nivel
          del mar; el % de rodados de un pitcher predice las carreras que permite en altitud (correlación{" "}
          {fmt2(cr.extrema.corr)}, IC95 {fmt2(cr.extrema.ic95[0])}–{fmt2(cr.extrema.ic95[1])}) pero no a nivel del mar
          ({fmt2(cr.mar.corr)}, IC95 {fmt2(cr.mar.ic95[0])}–{fmt2(cr.mar.ic95[1])}).
        </>
      ),
    },
    {
      h: "H4. El giro (rpm) solo es insuficiente; importa la forma",
      chip: "Confirmada", estado: "confirmada",
      veredicto: "Confirmada:",
      texto: (
        <>
          el giro es la variable física número {fmt0(lugarGiro)} por contribución SHAP; dominan el movimiento y las
          diferencias contra la recta. La etiqueta de tipo de lanzamiento se descarta porque la propia altitud la
          contamina (<Seccion n="6.2" />).
        </>
      ),
    },
  ];

  return (
    <>
      {filas.map((f) => (
        <Panel key={f.h} ancho={6} titulo={f.h} controles={<span className={`chip ${f.estado}`}>{f.chip}</span>}>
          <p className="pb m-0 text-[14px] leading-relaxed">
            <strong className="font-semibold">{f.veredicto}</strong> {f.texto}
          </p>
        </Panel>
      ))}
    </>
  );
}
