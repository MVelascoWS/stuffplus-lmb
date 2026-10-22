import { Kpis, Panel } from "@/components/consola/Panel";
import { SEDE_CORTA, fmt0, fmt2 } from "@/lib/format";
import type { MetaConvocatoria } from "@/types/convocatoria";

/** H3: cuánto más cuesta un elevado que un rodado en cada tipo de sede. */
export function Rodados({ meta }: { meta: MetaConvocatoria }) {
  const { elevado_menos_rodado: em, corr_rodados_vs_carreras: cr } = meta.contacto.h3;
  const nuloMar = cr.mar.ic95[0] <= 0 && cr.mar.ic95[1] >= 0;
  return (
    <Panel
      ancho={4}
      titulo="H3: elevado frente a rodado"
      meta="Cuántas carreras más cuesta un elevado que un rodado"
      pie={
        <>
          El % de rodados de un pitcher se correlaciona con las carreras que permite: {fmt2(cr.extrema.corr)} en altitud
          extrema (IC95 {fmt2(cr.extrema.ic95[0])} a {fmt2(cr.extrema.ic95[1])}; {fmt0(cr.extrema.n)} pitchers) y{" "}
          {fmt2(cr.mar.corr)} sin altitud (IC95 {fmt2(cr.mar.ic95[0])} a {fmt2(cr.mar.ic95[1])}; {fmt0(cr.mar.n)} pitchers)
          {nuloMar ? ", que no se distingue de cero" : ""}.
        </>
      }
    >
      <Kpis
        items={[
          { k: SEDE_CORTA["No Altitude"], v: `+${fmt2(em.mar)}`, d: "carreras" },
          { k: SEDE_CORTA["Extreme Altitude"], v: `+${fmt2(em.extrema)}`, d: "carreras" },
        ]}
      />
    </Panel>
  );
}
