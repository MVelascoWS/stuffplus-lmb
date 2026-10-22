import { Card, CardTitle } from "@/components/ui";
import { fmt1, fmtSigned } from "@/lib/format";
import type { Calibration } from "@/types/resultados";

/** Qué pasó en el campo con los lanzamientos de cada nivel de Stuff+. */
export function FieldMeaning({ calibration }: { calibration: Calibration }) {
  const { tabla, por_10_puntos, carreras_por_1000_lanz_por_10_puntos } = calibration;
  const pct = (v: number) => `${fmt1(v)}%`;
  return (
    <Card className="mt-8">
      <CardTitle sub="Agrupamos cada combinación de pitcher, lanzamiento y sede según su Stuff+ y medimos lo que efectivamente pasó con esos lanzamientos.">
        Qué significa un punto de Stuff+
      </CardTitle>
      <p className="mb-4 rounded-md bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-800">
        Cada 10 puntos de Stuff+ equivalen a{" "}
        <strong className="font-semibold">{fmtSigned(por_10_puntos.whiff_pct, 1)} puntos porcentuales de fallos por swing</strong>{" "}
        y <strong className="font-semibold">{fmt1(carreras_por_1000_lanz_por_10_puntos)} carreras menos por cada 1,000 lanzamientos</strong>.
      </p>
      <div data-scroll-x className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-xs text-neutral-600">
            <tr>
              <th scope="col" className="py-2 pr-2 text-left font-medium">Stuff+</th>
              <th scope="col" className="px-1.5 py-2 text-right font-medium sm:px-2">Carreras por 100 lanz. vs. promedio</th>
              <th scope="col" className="px-1.5 py-2 text-right font-medium sm:px-2">Fallos por swing</th>
              <th scope="col" className="px-1.5 py-2 text-right font-medium sm:px-2">Strikes cantados + fallos</th>
              <th scope="col" className="py-2 pl-1.5 text-right font-medium sm:pl-2">Contacto fuerte</th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((r) => (
              <tr key={r.nivel} className="border-b border-neutral-100 last:border-0">
                <td className="whitespace-nowrap py-2 pr-2 font-medium text-neutral-900">{r.nivel}</td>
                <td className="px-1.5 py-2 text-right tabular-nums sm:px-2">{fmtSigned(r.carreras_100, 2)}</td>
                <td className="px-1.5 py-2 text-right tabular-nums sm:px-2">{pct(r.whiff_pct)}</td>
                <td className="px-1.5 py-2 text-right tabular-nums sm:px-2">{pct(r.csw_pct)}</td>
                <td className="py-2 pl-1.5 text-right tabular-nums sm:pl-2">{pct(r.contacto_fuerte_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Carreras: positivo favorece al bateador, frente al promedio de su tipo de sede. Contacto fuerte: bolas en juego
        con velocidad de salida alta. Por cada 10 puntos también cambian los strikes cantados + fallos (
        {fmtSigned(por_10_puntos.csw_pct, 1)} puntos) y el contacto fuerte ({fmtSigned(por_10_puntos.contacto_fuerte_pct, 1)} puntos).
      </p>
    </Card>
  );
}
