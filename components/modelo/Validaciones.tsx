import type { ReactNode } from "react";
import { Card, CardTitle } from "@/components/ui";
import { fmt0, fmt2, fmtSigned } from "@/lib/format";
import type { MetaConvocatoria } from "@/types/convocatoria";

/** Categorías de altitud en el orden de la liga, con su nombre para mostrar. */
const CATEGORIAS: [string, string][] = [
  ["sin altitud", "Sin altitud"],
  ["altitud media", "Altitud media"],
  ["altitud extrema", "Altitud extrema"],
];

/** Las pruebas que pide la convocatoria, en una sola tabla. */
export function Validaciones({ meta }: { meta: MetaConvocatoria }) {
  const { pitcher_holdout: ph, park_holdout_estricto: park } = meta.robustez;
  const v = meta.validation;
  const filas: { nombre: string; mide: string; resultado: ReactNode }[] = [
    {
      nombre: "Baseline nulo por conteo",
      mide: `Error cuadrático por lanzamiento frente a predecir el promedio de cada conteo, con pitchers que el modelo no vio (${fmt0(ph.n_lanzamientos)} lanzamientos).`,
      resultado: `${fmtSigned(ph.mejora_mse_vs_nulo_pct, 2)}% de mejora`,
    },
    {
      nombre: "Pitcher holdout",
      mide: `Correlación entre Stuff+ y el valor de carrera real, por pitcher y lanzamiento, con pitchers que el modelo no vio (${fmt0(v.oof_n)} combinaciones).`,
      resultado: fmt2(v.oof_corr),
    },
    {
      nombre: "Season holdout",
      mide: "La misma correlación entrenando con temporadas anteriores y evaluando la siguiente.",
      resultado: fmt2(v.temporal_corr),
    },
    {
      nombre: "Park holdout estricto",
      mide: "Correlación en cada categoría de altitud sin que el modelo vea esa categoría ni a sus pitchers; entre paréntesis, viendo la sede.",
      resultado: (
        <ul className="space-y-0.5">
          {CATEGORIAS.filter(([k]) => park[k]).map(([k, label]) => (
            <li key={k} className="whitespace-nowrap">
              <span className="text-xs font-normal text-neutral-500">{label}</span> {fmt2(park[k].corr_sin_ver_sede)}{" "}
              <span className="font-normal text-neutral-500">({fmt2(park[k].corr_viendo_sede)})</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      nombre: "Estabilidad",
      mide: "Correlación del Stuff+ de un mismo pitcher y lanzamiento entre una temporada y la siguiente.",
      resultado: (
        <ul className="space-y-0.5">
          {v.year_to_year.map((y) => (
            <li key={y.par} className="whitespace-nowrap">
              <span className="text-xs font-normal text-neutral-500">{y.par.replace("->", "→")}</span> {fmt2(y.estab_stuff)}
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <Card className="mt-6">
      <CardTitle sub="Todas con datos que el modelo no vio al entrenar, salvo la estabilidad, que compara temporadas.">
        Validaciones que pide la convocatoria
      </CardTitle>
      <dl className="divide-y divide-neutral-100">
        {filas.map((f) => (
          <div key={f.nombre} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,14rem)] sm:gap-4">
            <dt className="font-medium text-neutral-900">{f.nombre}</dt>
            <dd className="text-sm text-neutral-600">{f.mide}</dd>
            <dd className="text-base font-semibold tabular-nums text-neutral-900 sm:text-right">{f.resultado}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
