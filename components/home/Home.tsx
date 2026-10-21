"use client";

import Link from "next/link";
import { WithData } from "@/components/DataProvider";
import { Stat } from "@/components/ui";
import type { DashboardMeta } from "@/lib/data";
import { TIPO_CON_ARTICULO, fmt0, fmt1, fmt2, fmtSigned } from "@/lib/format";

const VIEWS = [
  { href: "/simulador/", title: "Simulador", text: "Captura cualquier lanzamiento y mira cómo cambia su Stuff+ en el Harp Helú." },
  { href: "/pitchers/", title: "Pitchers", text: "¿Quién viaja bien a la CDMX? Ranking por Stuff+ proyectado y arsenal de cada pitcher." },
  { href: "/fisica/", title: "Física", text: "Cuánto movimiento pierde cada lanzamiento en altitud y la ley que lo explica." },
  { href: "/modelo/", title: "Modelo", text: "Cómo se construyó la métrica y las pruebas que la validan." },
  { href: "/reporte/", title: "Reporte", text: "El reporte técnico completo, para leer o imprimir." },
];

/** El tamaño de muestra más chico con el que Stuff+ predice mejor que el resultado real. */
function smallestWinningSample(meta: DashboardMeta) {
  return [...meta.validation.small_sample].sort((a, b) => a.N - b.N).find((s) => s.stuff > s.rv) ?? null;
}

function lista(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

export function Home() {
  return (
    <WithData>
      {({ meta }) => {
        const loss = meta.perdida_mov_tipo.observado_promedio;
        const sample = smallestWinningSample(meta);
        const deltas = [...meta.delta_tipo_proyectado].sort((a, b) => b.delta - a.delta);
        const winners = deltas.filter((d) => d.delta > 0).slice(0, 2);
        const loser = deltas[deltas.length - 1];
        const describe = (d: (typeof deltas)[number]) => `${TIPO_CON_ARTICULO[d.tipo]} (${fmtSigned(d.delta)})`;
        const ds = meta.dataset;
        return (
          <>
            <section className="mb-10 max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-wide text-accent">Stuff+ calibrado por altitud</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-4xl">
                En altitud extrema los lanzamientos pierden {fmt1(Math.abs(loss))}% de su movimiento, pero no todos por
                igual.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-neutral-700 sm:text-lg">
                La pérdida se midió comparando a cada pitcher consigo mismo, con el mismo lanzamiento, entre sedes de
                altitud extrema y a nivel del mar. Como Stuff+ compara contra los lanzamientos del mismo tipo de sede, lo
                que importa es quién pierde menos que los demás: en el Harp Helú ganan terreno{" "}
                {lista(winners.map(describe))}, y lo pierde {describe(loser)}.
              </p>
            </section>

            <section aria-label="Indicadores principales" className="mb-12 grid gap-4 sm:grid-cols-3">
              <Stat
                value={fmt0(ds.lanzamientos)}
                label={`lanzamientos analizados de ${fmt0(ds.pitchers)} pitchers en ${fmt0(ds.juegos)} juegos (${ds.temporadas[0]}–${ds.temporadas[ds.temporadas.length - 1]})`}
              />
              <Stat
                value={`${fmtSigned(loss, 1)}%`}
                label="de movimiento en altitud extrema frente a sedes a nivel del mar, mismo pitcher y mismo lanzamiento"
              />
              {sample && (
                <Stat
                  value={fmt0(sample.N)}
                  label={`lanzamientos bastan para que Stuff+ prediga el resto de la temporada mejor que el resultado real (correlación ${fmt2(sample.stuff)} contra ${fmt2(sample.rv)})`}
                />
              )}
            </section>

            <section aria-labelledby="explora">
              <h2 id="explora" className="mb-4 text-lg font-semibold text-neutral-900">Explora</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {VIEWS.map((v) => (
                  <li key={v.href}>
                    <Link
                      href={v.href}
                      className="group block h-full rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-accent"
                    >
                      <span className="font-medium text-neutral-900 group-hover:text-accent">{v.title} →</span>
                      <p className="mt-1 text-sm text-neutral-600">{v.text}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        );
      }}
    </WithData>
  );
}
