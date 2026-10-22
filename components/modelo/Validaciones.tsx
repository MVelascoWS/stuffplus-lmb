import type { ReactNode } from "react";
import { Panel } from "@/components/consola/Panel";
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
  // Estado de cada prueba: supera la referencia (negro) o no es concluyente (gris).
  const filas: { nombre: string; mide: string; resultado: ReactNode; ok: boolean }[] = [
    {
      nombre: "Baseline nulo por conteo",
      mide: `Error cuadrático por lanzamiento frente a predecir el promedio de cada conteo, con pitchers que el modelo no vio (${fmt0(ph.n_lanzamientos)} lanzamientos).`,
      resultado: `${fmtSigned(ph.mejora_mse_vs_nulo_pct, 2)}% de mejora`,
      ok: ph.mejora_mse_vs_nulo_pct > 0,
    },
    {
      nombre: "Pitcher holdout",
      mide: `Correlación entre Stuff+ y el valor de carrera real, por pitcher y lanzamiento, con pitchers que el modelo no vio (${fmt0(v.oof_n)} combinaciones).`,
      resultado: fmt2(v.oof_corr),
      ok: v.oof_corr > 0,
    },
    {
      nombre: "Season holdout",
      mide: "La misma correlación entrenando con temporadas anteriores y evaluando la siguiente.",
      resultado: fmt2(v.temporal_corr),
      ok: v.temporal_corr > 0,
    },
    {
      nombre: "Park holdout estricto",
      mide: "Correlación en cada categoría de altitud sin que el modelo vea esa categoría ni a sus pitchers; entre paréntesis, viendo la sede.",
      resultado: (
        <ul className="space-y-0.5">
          {CATEGORIAS.filter(([k]) => park[k]).map(([k, label]) => (
            <li key={k} className="whitespace-nowrap">
              <span className="text-xs font-normal text-grafito" style={{ fontStretch: "100%" }}>{label}</span> {fmt2(park[k].corr_sin_ver_sede)}{" "}
              <span className="font-normal text-grafito">({fmt2(park[k].corr_viendo_sede)})</span>
            </li>
          ))}
        </ul>
      ),
      ok: CATEGORIAS.every(([k]) => !park[k] || park[k].corr_sin_ver_sede > 0),
    },
    {
      nombre: "Estabilidad",
      mide: "Correlación del Stuff+ de un mismo pitcher y lanzamiento entre una temporada y la siguiente.",
      resultado: (
        <ul className="space-y-0.5">
          {v.year_to_year.map((y) => (
            <li key={y.par} className="whitespace-nowrap">
              <span className="text-xs font-normal text-grafito" style={{ fontStretch: "100%" }}>{y.par.replace("->", "→")}</span> {fmt2(y.estab_stuff)}
            </li>
          ))}
        </ul>
      ),
      ok: v.year_to_year.every((y) => y.estab_stuff > y.estab_rv),
    },
  ];

  return (
    <Panel ancho={12} titulo="Validaciones que pide la convocatoria" meta="Todas con datos que el modelo no vio al entrenar, salvo la estabilidad, que compara temporadas">
      <dl className="m-0">
        {filas.map((f) => (
          <div key={f.nombre} className="grid gap-1 border-b border-linea px-[18px] py-3 last:border-b-0 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,15rem)] sm:gap-4">
            <dt className="flex flex-wrap items-center gap-2 font-semibold">
              {f.nombre}
              <span className={`chip ${f.ok ? "confirmada" : "nc"}`}>{f.ok ? "Supera" : "No concluyente"}</span>
            </dt>
            <dd className="m-0 text-[13px] text-grafito">{f.mide}</dd>
            <dd className="num m-0 text-[20px] font-bold sm:text-right">{f.resultado}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
