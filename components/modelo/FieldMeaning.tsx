import { Kpis, Panel } from "@/components/consola/Panel";
import { fmt1, fmtSigned } from "@/lib/format";
import type { Calibration } from "@/types/resultados";

/** Qué pasó en el campo con los lanzamientos de cada nivel de Stuff+. */
export function FieldMeaning({ calibration, ancho = 7 }: { calibration: Calibration; ancho?: 7 | 12 }) {
  const { tabla, por_10_puntos: p10, carreras_por_1000_lanz_por_10_puntos } = calibration;
  const pct = (v: number) => `${fmt1(v)}%`;
  return (
    <Panel
      ancho={ancho}
      titulo="Qué significa un punto de Stuff+"
      meta="Lo que pasó en el campo con cada nivel, por pitcher, lanzamiento y sede"
      pie="Carreras: positivo favorece al bateador, frente al promedio de su tipo de sede. Contacto fuerte: bolas en juego con velocidad de salida alta."
    >
      <Kpis
        items={[
          { k: "Cada 10 puntos de Stuff+", v: `${fmtSigned(p10.whiff_pct, 1)} pp`, d: "de fallos por swing" },
          { k: "Cada 10 puntos de Stuff+", v: `−${fmt1(carreras_por_1000_lanz_por_10_puntos)}`, d: "carreras por cada 1,000 lanzamientos" },
          { k: "Cada 10 puntos de Stuff+", v: `${fmtSigned(p10.contacto_fuerte_pct, 1)} pp`, d: `de contacto fuerte; ${fmtSigned(p10.csw_pct, 1)} pp de strikes cantados + fallos` },
        ]}
      />
      <div data-scroll-x className="overflow-x-auto border-t border-linea">
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Stuff+</th>
              <th scope="col" className="n">Carreras por 100 lanz. vs. promedio</th>
              <th scope="col" className="n">Fallos por swing</th>
              <th scope="col" className="n">Strikes cantados + fallos</th>
              <th scope="col" className="n">Contacto fuerte</th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((r, i) => (
              <tr key={r.nivel}>
                <td className="whitespace-nowrap font-semibold">{r.nivel}</td>
                {/* El nivel más alto es lo élite: va en rojo. */}
                <td className={`n ${i === tabla.length - 1 ? "text-rojo" : ""}`}>{fmtSigned(r.carreras_100, 2)}</td>
                <td className={`n ${i === tabla.length - 1 ? "text-rojo" : ""}`}>{pct(r.whiff_pct)}</td>
                <td className="n">{pct(r.csw_pct)}</td>
                <td className="n">{pct(r.contacto_fuerte_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
