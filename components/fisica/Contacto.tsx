import { Card, CardTitle } from "@/components/ui";
import { TIPO_LABEL, fmt0, fmt1, fmtSigned } from "@/lib/format";
import type { ContactoFila, Intervalo, MetaConvocatoria } from "@/types/convocatoria";

const cruzaCero = ([a, b]: Intervalo) => a <= 0 && b >= 0;

/** Un cambio con su intervalo de 95%; si el intervalo cruza el cero, se dice que no se distingue de cero. */
function ConIntervalo({ v, ic, digits, unidad }: { v: number; ic: Intervalo; digits: number; unidad: string }) {
  const nulo = cruzaCero(ic);
  return (
    <>
      <span className={nulo ? "text-neutral-400" : "font-semibold text-neutral-900"}>
        {fmtSigned(v, digits)}{unidad}
      </span>
      <span className="block text-[11px] text-neutral-500">
        {fmtSigned(ic[0], digits)} a {fmtSigned(ic[1], digits)}
      </span>
      {nulo && <span className="block text-[11px] text-neutral-500">no distinguible de cero</span>}
    </>
  );
}

function Tabla({ filas, primera }: { filas: (ContactoFila & { nombre: string; total?: boolean })[]; primera: string }) {
  return (
    <div data-scroll-x className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200 text-xs text-neutral-600">
          <tr className="align-bottom">
            <th scope="col" className="py-2 pr-2 text-left font-medium">{primera}</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">Jonrones por 100 bolas en juego</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">Cambio en jonrones</th>
            <th scope="col" className="py-2 pl-2 text-right font-medium">Contacto duro</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.nombre} className={`border-b border-neutral-100 align-top last:border-0 ${f.total ? "bg-neutral-50" : ""}`}>
              <td className={`py-2 pr-2 ${f.total ? "font-semibold" : ""} text-neutral-900`}>{f.nombre}</td>
              <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                <span className="text-neutral-500">{fmt1(f.hr100_mar)}</span> → {fmt1(f.hr100_extrema)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                <ConIntervalo v={f.hr_riesgo_pct} ic={f.hr_ic95} digits={0} unidad="%" />
              </td>
              <td className="py-2 pl-2 text-right tabular-nums">
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
    <Card className="mt-6">
      <CardTitle
        sub={`Los mismos ${fmt0(c.pitchers)} pitchers en sedes sin altitud y de altitud extrema. Jonrones: de sin altitud → altitud extrema. Cambios con su intervalo de 95%; contacto duro en puntos porcentuales de las bolas en juego con velocidad de salida alta.`}
      >
        Riesgo de contacto duro y jonrón en altitud
      </CardTitle>
      <Tabla filas={porTipo} primera="Lanzamiento" />
      <h3 className="mt-6 text-sm font-semibold text-neutral-900">Rectas de cuatro costuras según su “ride”</h3>
      <p className="mb-2 text-xs text-neutral-600">
        Tercios del movimiento vertical (IVB) de la recta de cada pitcher medido a nivel del mar.
      </p>
      <Tabla filas={porRide} primera="Perfil de la recta" />
      <p className="mt-3 text-xs text-neutral-500">
        En gris, los cambios cuyo intervalo de 95% incluye el cero: con estos datos no se distinguen de cero. Cambio
        en jonrones: relativo, por bola en juego. Contacto duro: diferencia en puntos porcentuales (pp).
      </p>
    </Card>
  );
}
