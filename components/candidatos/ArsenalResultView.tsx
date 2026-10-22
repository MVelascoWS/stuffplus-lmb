import { LeversPanel } from "@/components/simulador/LeversPanel";
import { equivalencia } from "@/components/simulador/equivalencias";
import { Card, CardTitle } from "@/components/ui";
import type { ArsenalResult } from "@/lib/arsenal";
import { FASTBALL_TYPES } from "@/lib/data";
import { SEDE_CORTA, TIPO_LABEL, fmt0, fmt1, fmtSigned, fmtStuff } from "@/lib/format";
import type { PitchType, SedeKey } from "@/lib/simulator";
import type { MetaConResultados } from "@/types/resultados";

const SEDES: SedeKey[] = ["No Altitude", "Medium Altitude", "Harp Helu"];

/** Las palancas se buscan en lanzamientos con al menos este uso: mejorar uno marginal mueve poco el arsenal. */
const USO_MINIMO_PALANCAS = 10;

const esRecta = (t: PitchType) => (FASTBALL_TYPES as readonly string[]).includes(t);

/** Cómo se llama la recta principal; si el arsenal no tiene recta, se aclara que es solo una referencia. */
export function etiquetaRecta(t: PitchType): string {
  return esRecta(t)
    ? TIPO_LABEL[t]
    : `${TIPO_LABEL[t]}: lanzamiento de referencia (el arsenal no tiene recta; se usa el más rápido)`;
}

export function ArsenalResultView({ result, meta, minN }: { result: ArsenalResult; meta: MetaConResultados; minN: number }) {
  const harp = result.stuff["Harp Helu"], base = result.stuff["No Altitude"];
  const delta = harp - base;
  const eq = equivalencia(meta, delta);
  const candidatos = result.pitches.filter((p) => p.uso >= USO_MINIMO_PALANCAS);
  const debil = [...candidatos].sort((a, b) => a.stuff["Harp Helu"] - b.stuff["Harp Helu"])[0];

  return (
    <div className="space-y-6">
      <Card className="border-accent bg-accent-soft">
        <p className="text-sm font-medium text-accent">Stuff+ del arsenal en el Harp Helú</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-5xl font-semibold tabular-nums text-neutral-900">{fmtStuff(harp)}</span>
          <span className="text-sm text-neutral-700">
            por encima del {fmt0(result.percentil["Harp Helu"])}% de los pitchers de la LMB (≥{fmt0(minN)} lanzamientos)
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          {SEDES.map((s) => (
            <div key={s} className="rounded-md bg-white/70 p-2">
              <dt className="text-[11px] text-neutral-500">{SEDE_CORTA[s]}</dt>
              <dd className="text-lg font-semibold tabular-nums text-neutral-900">{fmtStuff(result.stuff[s])}</dd>
              <dd className="text-[11px] text-neutral-500">percentil {fmt0(result.percentil[s])}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-neutral-800">
          Contra sin altitud, el arsenal cambia <strong className="font-semibold">{fmtSigned(delta)}</strong> puntos en el
          Harp Helú{eq ? `: equivale a ${eq.fallos} y ${eq.carreras}.` : "."}
        </p>
        <p className="mt-2 text-xs text-neutral-600">Recta principal: {etiquetaRecta(result.recta)}</p>
      </Card>

      <Card>
        <CardTitle sub="Stuff+ de cada lanzamiento por sede, calificado contra la recta principal del mismo arsenal.">
          Por lanzamiento
        </CardTitle>
        {/* Tabla en pantallas anchas; tarjetas en celular. */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-xs text-neutral-600">
              <tr>
                <th scope="col" className="py-2 pr-2 text-left font-medium">Lanzamiento</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Uso</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Sin altitud</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Altitud media</th>
                <th scope="col" className="px-2 py-2 text-right font-medium text-accent">Harp Helú</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Cambio</th>
                <th scope="col" className="py-2 pl-2 text-right font-medium">Movimiento</th>
              </tr>
            </thead>
            <tbody>
              {result.pitches.map((p, i) => (
                <tr key={i} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2 pr-2 text-neutral-900">
                    {TIPO_LABEL[p.tipo]}
                    {p.esRecta && <span className="ml-1.5 rounded bg-neutral-100 px-1 text-[11px] text-neutral-600">recta</span>}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-neutral-600">{fmt0(p.uso)}%</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtStuff(p.stuff["No Altitude"])}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtStuff(p.stuff["Medium Altitude"])}</td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums">{fmtStuff(p.stuff["Harp Helu"])}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtSigned(p.stuff["Harp Helu"] - p.stuff["No Altitude"])}</td>
                  <td className="whitespace-nowrap py-2 pl-2 text-right tabular-nums text-neutral-700">
                    {fmt1(p.movimiento["No Altitude"])} → {fmt1(p.movimiento["Harp Helu"])} in
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="space-y-3 md:hidden">
          {result.pitches.map((p, i) => (
            <li key={i} className="rounded-md border border-neutral-200 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-neutral-900">
                  {TIPO_LABEL[p.tipo]}
                  {p.esRecta && <span className="ml-1.5 rounded bg-neutral-100 px-1 text-[11px] font-normal text-neutral-600">recta</span>}
                </span>
                <span className="text-xs text-neutral-500">{fmt0(p.uso)}% de uso</span>
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-1 text-center text-xs">
                {SEDES.map((s) => (
                  <div key={s}>
                    <dt className={s === "Harp Helu" ? "text-accent" : "text-neutral-500"}>{SEDE_CORTA[s]}</dt>
                    <dd className="text-base font-semibold tabular-nums text-neutral-900">{fmtStuff(p.stuff[s])}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-neutral-600">
                Cambio: <span className="font-medium text-neutral-900">{fmtSigned(p.stuff["Harp Helu"] - p.stuff["No Altitude"])}</span>
                {" · "}Movimiento: {fmt1(p.movimiento["No Altitude"])} → {fmt1(p.movimiento["Harp Helu"])} in
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {debil && (
        <LeversPanel
          meta={meta}
          tipo={debil.tipo}
          soloUtiles
          title={`Qué mejorar primero: ${TIPO_LABEL[debil.tipo].toLowerCase()}, el lanzamiento más débil en el Harp Helú (${fmtStuff(debil.stuff["Harp Helu"])})`}
        />
      )}
    </div>
  );
}
