import { LineScore } from "@/components/consola/LineScore";
import { Panel } from "@/components/consola/Panel";
import type { ArsenalInput, ArsenalResult } from "@/lib/arsenal";
import { TIPO_CORTO, fmt0, fmtSigned, fmtStuff } from "@/lib/format";

export const LETRAS = ["A", "B", "C"] as const;
export type Letra = (typeof LETRAS)[number];

export interface Comparado {
  letra: Letra;
  input: ArsenalInput;
  /** ID del pitcher de la LMB si se cargó como ejemplo sin cambios */
  origen: string | null;
}

/** Hasta tres candidatos como equipos de un marcador: cada arsenal es una fila. */
export function Comparison({ items, results, onRemove, onEdit, nLiga }: {
  items: Comparado[];
  results: ArsenalResult[] | null;
  onRemove: (l: Letra) => void;
  onEdit: (l: Letra) => void;
  nLiga: number;
}) {
  const extremo = (r: ArsenalResult, mejor: boolean) => {
    const orden = [...r.pitches].sort((a, b) => b.stuff["Harp Helu"] - a.stuff["Harp Helu"]);
    const p = mejor ? orden[0] : orden[orden.length - 1];
    return `${TIPO_CORTO[p.tipo]} ${fmtStuff(p.stuff["Harp Helu"])}`;
  };
  return (
    <Panel
      ancho={12}
      titulo="Comparar candidatos"
      meta="Cada arsenal es una fila; agrega hasta tres desde el encabezado"
      pie={`Pct. LMB: por encima de qué porcentaje de los ${fmt0(nLiga)} pitchers de la liga queda el arsenal en el Harp Helú.`}
    >
      {items.length === 0 ? (
        <p className="pb text-sm text-grafito">
          Usa “Agregar a la comparación” para guardar el arsenal actual y compararlo con hasta dos candidatos más.
        </p>
      ) : !results ? (
        <p className="pb text-sm text-grafito motion-safe:animate-pulse">Calculando la comparación…</p>
      ) : (
        <LineScore
          titulo="Candidato"
          className="cmp"
          columnas={[
            { key: "ars", label: "Arsenal", txt: true },
            { key: "mar", label: "Sin altitud" },
            { key: "media", label: "Media" },
            { key: "hh", label: "Harp Helú", hh: true },
            { key: "pct", label: "Pct. LMB", tot: true },
            { key: "d", label: "Δ" },
            { key: "ext", label: "Mejor y peor", txt: true },
          ]}
          filas={items.map((it, i) => {
            const r = results[i];
            return {
              key: it.letra,
              label: it.letra,
              team: true,
              celdas: {
                ars: (
                  <>
                    <span className="block">{it.origen ?? it.input.pitches.map((p) => TIPO_CORTO[p.tipo]).join(", ")}</span>
                    <span className="mt-1 flex gap-3 text-xs">
                      <button type="button" className="underline-offset-2 hover:underline" onClick={() => onEdit(it.letra)}>Editar</button>
                      <button type="button" className="underline-offset-2 hover:underline" onClick={() => onRemove(it.letra)}>Quitar</button>
                    </span>
                  </>
                ),
                mar: fmtStuff(r.stuff["No Altitude"]),
                media: fmtStuff(r.stuff["Medium Altitude"]),
                hh: fmtStuff(r.stuff["Harp Helu"]),
                pct: fmt0(r.percentil["Harp Helu"]),
                d: fmtSigned(Math.round(r.stuff["Harp Helu"]) - Math.round(r.stuff["No Altitude"])),
                ext: <>{extremo(r, true)}<br />{extremo(r, false)}</>,
              },
            };
          })}
        />
      )}
    </Panel>
  );
}
