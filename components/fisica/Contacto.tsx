import { Panel } from "@/components/consola/Panel";
import { TIPO_LABEL, fmt0, fmt1, fmtSigned } from "@/lib/format";
import type { ContactoFila, Intervalo, MetaConvocatoria } from "@/types/convocatoria";

const cruzaCero = ([a, b]: Intervalo) => a <= 0 && b >= 0;

/** Un cambio con su intervalo de 95%; si el intervalo cruza el cero, se dice que no se distingue de cero. */
function ConIntervalo({ v, ic, digits, unidad }: { v: number; ic: Intervalo; digits: number; unidad: string }) {
  const nulo = cruzaCero(ic);
  return (
    <>
      <span className={nulo ? "font-normal text-grafito" : ""}>
        {fmtSigned(v, digits)}{unidad}
      </span>
      <span className="block text-[11px] font-normal text-grafito">
        {fmtSigned(ic[0], digits)} a {fmtSigned(ic[1], digits)}
      </span>
      {nulo && <span className="block text-[11px] font-normal text-grafito" style={{ fontStretch: "100%" }}>no distinguible de cero</span>}
    </>
  );
}

function Tabla({ filas, primera }: { filas: (ContactoFila & { nombre: string; total?: boolean })[]; primera: string }) {
  return (
    <div data-scroll-x className="overflow-x-auto">
      <table className="tabla">
        <thead>
          <tr>
            <th scope="col">{primera}</th>
            <th scope="col" className="n">Jonrones por 100 bolas en juego</th>
            <th scope="col" className="n">Cambio en jonrones</th>
            <th scope="col" className="n">Contacto duro</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.nombre} className={f.total ? "bg-lienzo" : ""}>
              <td className={f.total ? "font-semibold" : ""}>{f.nombre}</td>
              <td className="n whitespace-nowrap">
                <span className="tenue">{fmt1(f.hr100_mar)}</span> → {fmt1(f.hr100_extrema)}
              </td>
              <td className="n">
                <ConIntervalo v={f.hr_riesgo_pct} ic={f.hr_ic95} digits={0} unidad="%" />
              </td>
              <td className="n">
                <ConIntervalo v={f.duro_dif_pp} ic={f.duro_ic95_pp} digits={1} unidad=" pp" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Riesgo de contacto duro y jonrón al pasar de sedes sin altitud a altitud extrema, con los mismos pitchers. */
export function Contacto({ meta }: { meta: MetaConvocatoria }) {
  const c = meta.contacto;
  const [c1, c2] = c.ride_cortes_in;
  const porTipo = [
    ...c.por_tipo.map((f) => ({ ...f, nombre: TIPO_LABEL[f.tipo] })),
    ...c.total.map((f) => ({ ...f, nombre: f.t, total: true })),
  ];
  const rangoRide: Record<string, string> = {
    "ride bajo": `menos de ${fmt1(c1)} in`,
    "ride medio": `${fmt1(c1)} a ${fmt1(c2)} in`,
    "ride alto": `más de ${fmt1(c2)} in`,
  };
  const porRide = c.recta_por_ride.map((f) => ({
    ...f,
    nombre: `${f.perfil.charAt(0).toUpperCase()}${f.perfil.slice(1)} (${rangoRide[f.perfil] ?? ""})`,
  }));

  return (
    <Panel
      ancho={8}
      titulo="Riesgo de contacto duro y jonrón en altitud"
      meta={`Los mismos ${fmt0(c.pitchers)} pitchers, sin altitud → altitud extrema; cambios con su intervalo de 95%`}
      pie="En gris, los cambios cuyo intervalo de 95% incluye el cero: con estos datos no se distinguen de cero. Cambio en jonrones: relativo, por bola en juego. Contacto duro: diferencia en puntos porcentuales (pp) de las bolas en juego con velocidad de salida alta."
    >
      <Tabla filas={porTipo} primera="Lanzamiento" />
      <div className="border-t border-linea px-[18px] pb-2 pt-3.5">
        <h3 className="m-0 text-[15px] font-bold">Rectas de cuatro costuras según su “ride”</h3>
        <span className="text-xs text-grafito">Tercios del movimiento vertical (IVB) de la recta de cada pitcher, medido a nivel del mar.</span>
      </div>
      <Tabla filas={porRide} primera="Perfil de la recta" />
    </Panel>
  );
}
