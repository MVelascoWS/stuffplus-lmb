import type { ReactNode } from "react";
import { LineScore } from "@/components/consola/LineScore";
import { Kpis, Panel } from "@/components/consola/Panel";
import { ListaPalancas, pieDePalancas } from "@/components/consola/Palancas";
import type { ArsenalResult } from "@/lib/arsenal";
import { FASTBALL_TYPES } from "@/lib/data";
import { TIPO_LABEL, fmt0, fmt1, fmtMeters, fmtSigned, fmtStuff } from "@/lib/format";
import { tangibles, type PitchType, type SedeKey } from "@/lib/simulator";
import type { MetaConResultados } from "@/types/resultados";

/** Las palancas se buscan en lanzamientos con al menos este uso: mejorar uno marginal mueve poco el arsenal. */
const USO_MINIMO_PALANCAS = 10;

const esRecta = (t: PitchType) => (FASTBALL_TYPES as readonly string[]).includes(t);

/** Cómo se llama la recta principal; si el arsenal no tiene recta, se aclara que es solo una referencia. */
export function etiquetaRecta(t: PitchType): string {
  return esRecta(t)
    ? TIPO_LABEL[t]
    : `${TIPO_LABEL[t]}: lanzamiento de referencia (el arsenal no tiene recta; se usa el más rápido)`;
}

export function ArsenalResultView({ result, meta, minN, pie }: { result: ArsenalResult; meta: MetaConResultados; minN: number; pie: ReactNode }) {
  const s = (k: SedeKey) => result.stuff[k];
  const harp = s("Harp Helu"), base = s("No Altitude");
  const t = tangibles(meta, harp - base);
  const candidatos = result.pitches.filter((p) => p.uso >= USO_MINIMO_PALANCAS);
  const debil = [...candidatos].sort((a, b) => a.stuff["Harp Helu"] - b.stuff["Harp Helu"])[0];
  const pct = (k: SedeKey) => fmt0(result.percentil[k]);

  return (
    <Panel ancho={7} className="primero-movil" titulo="Resultado del arsenal" meta={`Recta principal: ${etiquetaRecta(result.recta)}`} pie={pie}>
      <LineScore
        titulo="Arsenal"
        columnas={[
          { key: "mar", label: "Sin altitud", sub: fmtMeters(meta.sedes["No Altitude"].h) },
          { key: "media", label: "Altitud media", sub: fmtMeters(meta.sedes["Medium Altitude"].h) },
          { key: "hh", label: "Harp Helú", sub: fmtMeters(meta.sedes["Harp Helu"].h), hh: true },
          { key: "d", label: "Δ", sub: "vs. sin altitud", tot: true },
        ]}
        filas={[
          {
            key: "s", label: "Stuff+", main: true,
            celdas: { mar: fmtStuff(base), media: fmtStuff(s("Medium Altitude")), hh: fmtStuff(harp), d: fmtSigned(Math.round(harp) - Math.round(base)) },
          },
          {
            key: "p", label: "Percentil en la LMB",
            celdas: { mar: pct("No Altitude"), media: pct("Medium Altitude"), hh: pct("Harp Helu"), d: fmtSigned(result.percentil["Harp Helu"] - result.percentil["No Altitude"]) },
          },
        ]}
      />
      <Kpis
        borde
        items={[
          { k: "Stuff+ en el Harp Helú", v: fmtStuff(harp), tono: "r", d: "Promedio ponderado por uso" },
          { k: "Percentil en la LMB", v: pct("Harp Helu"), d: `Por encima de ese % de los pitchers de la liga (≥${fmt0(minN)} lanzamientos)` },
          {
            k: "Equivalencia del cambio en el campo",
            v: t ? `${fmtSigned(t.whiffPp, 1)} pp` : "—",
            d: t ? `De fallos por swing; ${fmt1(Math.abs(t.carrerasPor1000))} carreras ${t.carrerasPor1000 <= 0 ? "menos" : "más"} por cada 1,000 lanzamientos` : undefined,
          },
        ]}
      />

      <div className="overflow-x-auto border-t border-linea" data-scroll-x>
        <table className="tabla min-w-[520px]">
          <thead>
            <tr>
              <th scope="col">Lanzamiento</th>
              <th scope="col" className="n">Uso</th>
              <th scope="col" className="n">Sin altitud</th>
              <th scope="col" className="n">Media</th>
              <th scope="col" className="n hh">Harp Helú</th>
              <th scope="col" className="n">Δ</th>
              <th scope="col" className="n">Movimiento (in)</th>
            </tr>
          </thead>
          <tbody>
            {result.pitches.map((p, i) => (
              <tr key={i}>
                <td>
                  {TIPO_LABEL[p.tipo]}
                  {p.esRecta && <span className="chip ml-1.5">{esRecta(p.tipo) ? "recta" : "referencia"}</span>}
                </td>
                <td className="n tenue">{fmt0(p.uso)}%</td>
                <td className="n">{fmtStuff(p.stuff["No Altitude"])}</td>
                <td className="n">{fmtStuff(p.stuff["Medium Altitude"])}</td>
                <td className="n hh">{fmtStuff(p.stuff["Harp Helu"])}</td>
                <td className="n">{fmtSigned(p.stuff["Harp Helu"] - p.stuff["No Altitude"])}</td>
                <td className="n tenue whitespace-nowrap">{fmt1(p.movimiento["No Altitude"])} → {fmt1(p.movimiento["Harp Helu"])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {debil && (
        <div className="border-t border-linea">
          <div className="px-[18px] pt-3.5">
            <h3 className="m-0 text-[15px] font-bold">Qué mejorar primero: {TIPO_LABEL[debil.tipo].toLowerCase()}</h3>
            <span className="text-xs text-grafito">
              El lanzamiento más débil en el Harp Helú ({fmtStuff(debil.stuff["Harp Helu"])}) con al menos {USO_MINIMO_PALANCAS}% de uso.{" "}
              {pieDePalancas(debil.tipo)}
            </span>
          </div>
          <ListaPalancas meta={meta} tipo={debil.tipo} soloUtiles />
        </div>
      )}
    </Panel>
  );
}
