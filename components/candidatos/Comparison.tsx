import { Card, CardTitle } from "@/components/ui";
import type { ArsenalInput, ArsenalResult } from "@/lib/arsenal";
import { TIPO_CORTO, TIPO_LABEL, fmt0, fmtSigned, fmtStuff } from "@/lib/format";

export const LETRAS = ["A", "B", "C"] as const;
export type Letra = (typeof LETRAS)[number];

export interface Comparado {
  letra: Letra;
  input: ArsenalInput;
  /** ID del pitcher de la LMB si se cargó como ejemplo sin cambios */
  origen: string | null;
}

/** Hasta tres candidatos lado a lado. */
export function Comparison({ items, results, onRemove, onEdit }: {
  items: Comparado[];
  results: ArsenalResult[];
  onRemove: (l: Letra) => void;
  onEdit: (l: Letra) => void;
}) {
  const extremos = (r: ArsenalResult) => {
    const orden = [...r.pitches].sort((a, b) => b.stuff["Harp Helu"] - a.stuff["Harp Helu"]);
    const f = (p: (typeof orden)[number]) => `${TIPO_CORTO[p.tipo]} (${fmtStuff(p.stuff["Harp Helu"])})`;
    return { mejor: f(orden[0]), peor: f(orden[orden.length - 1]) };
  };
  const rows: { label: string; value: (r: ArsenalResult) => string; strong?: boolean }[] = [
    { label: "Stuff+ en el Harp Helú", value: (r) => fmtStuff(r.stuff["Harp Helu"]), strong: true },
    { label: "Percentil en la LMB", value: (r) => fmt0(r.percentil["Harp Helu"]) },
    { label: "Cambio contra sin altitud", value: (r) => fmtSigned(r.stuff["Harp Helu"] - r.stuff["No Altitude"]) },
    { label: "Mejor lanzamiento", value: (r) => extremos(r).mejor },
    { label: "Peor lanzamiento", value: (r) => extremos(r).peor },
  ];

  return (
    <Card>
      <CardTitle sub="Cada columna es un arsenal guardado con “Agregar a la comparación”.">Comparación</CardTitle>
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b border-neutral-200 align-top">
            <th scope="col" className="w-[34%] py-2 pr-2 text-left text-xs font-medium text-neutral-600">
              <span className="sr-only">Medida</span>
            </th>
            {items.map((it) => (
              <th key={it.letra} scope="col" className="px-1 py-2 text-right">
                <span className="block text-base font-semibold text-accent">{it.letra}</span>
                <span className="block truncate text-[11px] font-normal text-neutral-500" title={it.origen ?? undefined}>
                  {it.origen ?? it.input.pitches.map((p) => TIPO_CORTO[p.tipo]).join(" · ")}
                </span>
                <span className="mt-1 flex flex-col items-end gap-0.5 text-[11px] font-normal sm:flex-row sm:justify-end sm:gap-2">
                  <button type="button" onClick={() => onEdit(it.letra)} className="text-neutral-600 hover:text-accent">Editar</button>
                  <button type="button" onClick={() => onRemove(it.letra)} className="text-neutral-600 hover:text-accent">Quitar</button>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-neutral-100 last:border-0">
              <th scope="row" className="py-2 pr-2 text-left text-xs font-normal text-neutral-600">{row.label}</th>
              {results.map((r, i) => (
                <td key={items[i].letra} className={`px-1 py-2 text-right tabular-nums ${row.strong ? "text-lg font-semibold text-neutral-900" : "text-neutral-800"}`}>
                  {row.value(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {items.some((it) => it.input.pitches.some((p) => p.tipo === "Four-Seam")) && (
        <p className="mt-3 text-xs text-neutral-500">{TIPO_CORTO["Four-Seam"]}: {TIPO_LABEL["Four-Seam"].toLowerCase()}.</p>
      )}
    </Card>
  );
}
