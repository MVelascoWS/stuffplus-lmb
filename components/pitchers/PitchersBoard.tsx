"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { WithData } from "@/components/DataProvider";
import { PROJECTION_ANCHOR } from "@/components/modelo/ProjectionCheck";
import { PageIntro } from "@/components/ui";
import type { ArsenalPitch, DashboardData, Pitcher } from "@/lib/data";
import { MANO_LABEL, TIPO_LABEL, fmt0, fmt1, fmtSigned, fmtStuff } from "@/lib/format";
import { conResultados } from "@/types/resultados";

type SortKey = "pitcher_anon_id" | "mano" | "n" | "stuff" | "stuff_mar" | "stuff_media" | "stuff_extrema" | "stuff_cdmx_proy" | "delta_cdmx_proy";
type Mano = "all" | "Right" | "Left";

const PAGE = 25;

/** Columnas de la tabla. Las marcadas como `wide` se ocultan en pantallas angostas. */
const COLUMNS: { key: SortKey; label: string; title?: string; numeric?: boolean; wide?: boolean }[] = [
  { key: "pitcher_anon_id", label: "Pitcher" },
  { key: "mano", label: "Mano", wide: true },
  { key: "n", label: "Lanz.", title: "Lanzamientos registrados", numeric: true, wide: true },
  { key: "stuff", label: "Global", title: "Stuff+ en todas las sedes", numeric: true, wide: true },
  { key: "stuff_mar", label: "Mar", title: "Stuff+ en sedes sin altitud", numeric: true },
  { key: "stuff_media", label: "Media", title: "Stuff+ en sedes de altitud media", numeric: true, wide: true },
  { key: "stuff_extrema", label: "Extrema", title: "Stuff+ en sedes de altitud extrema", numeric: true, wide: true },
  { key: "stuff_cdmx_proy", label: "CDMX", title: "Stuff+ proyectado en el Harp Helú", numeric: true },
  { key: "delta_cdmx_proy", label: "Δ", title: "Cambio proyectado: CDMX menos nivel del mar", numeric: true },
];

export function PitchersBoard() {
  const initial = useSearchParams().get("p");
  return <WithData>{(data) => <Board data={data} initial={initial} />}</WithData>;
}

function compare(a: Pitcher, b: Pitcher, key: SortKey, dir: 1 | -1): number {
  const va = a[key], vb = b[key];
  // Los valores faltantes van siempre al final, sin importar la dirección.
  if (va == null && vb == null) return 0;
  if (va == null) return 1;
  if (vb == null) return -1;
  if (typeof va === "string" && typeof vb === "string") return dir * va.localeCompare(vb);
  return dir * ((va as number) - (vb as number));
}

function Board({ data, initial }: { data: DashboardData; initial: string | null }) {
  const { pitchers, arsenal } = data;
  const [query, setQuery] = useState(initial ?? "");
  const [mano, setMano] = useState<Mano>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "stuff_cdmx_proy", dir: -1 });
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(initial);

  const byPitcher = useMemo(() => {
    const m = new Map<string, ArsenalPitch[]>();
    for (const a of arsenal) m.set(a.pitcher_anon_id, [...(m.get(a.pitcher_anon_id) ?? []), a]);
    for (const list of m.values()) list.sort((x, y) => y.uso - x.uso);
    return m;
  }, [arsenal]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pitchers
      .filter((p) => (mano === "all" || p.mano === mano) && (!q || p.pitcher_anon_id.includes(q)))
      .sort((a, b) => compare(a, b, sort.key, sort.dir));
  }, [pitchers, query, mano, sort]);

  const minN = Math.min(...pitchers.map((p) => p.n));

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "pitcher_anon_id" || key === "mano" ? 1 : -1 }));
    setLimit(PAGE);
  };
  const toggleOpen = (id: string) => {
    const next = open === id ? null : id;
    setOpen(next);
    // La URL refleja el pitcher abierto para poder compartir el enlace.
    window.history.replaceState(null, "", next ? `?p=${next}` : window.location.pathname);
  };

  return (
    <>
      <PageIntro title="¿Quién viaja bien a la CDMX?">
        <p>
          {fmt0(pitchers.length)} pitchers con al menos {fmt0(minN)} lanzamientos, ordenados por su Stuff+ proyectado en
          el Estadio Alfredo Harp Helú: sus lanzamientos tirados a nivel del mar, trasladados a la altitud de la CDMX con
          la ley física y calificados de nuevo por el modelo.
        </p>
        <p>
          La columna Δ es lo que gana o pierde cada pitcher frente a su Stuff+ a nivel del mar. Toca un pitcher para ver
          su arsenal y abrir cualquier lanzamiento en el simulador.
        </p>
        <p className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">Proyección validada:</span> con pitchers que el modelo no vio,
          anticipa su Stuff+ en altitud con {fmt0(conResultados(data.meta).projection_validation.reduccion_error_pct)}% menos
          error que suponer que rinden igual.{" "}
          <Link href={`/modelo/#${PROJECTION_ANCHOR}`} className="whitespace-nowrap text-accent underline-offset-2 hover:underline">
            Ver la validación →
          </Link>
        </p>
      </PageIntro>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Buscar pitcher (ej. 00952)"
          aria-label="Buscar pitcher"
          className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none sm:max-w-xs"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
        />
        <div role="group" aria-label="Filtrar por mano" className="flex rounded border border-neutral-300 bg-white p-0.5 text-sm">
          {([["all", "Todos"], ["Right", "Derechos"], ["Left", "Zurdos"]] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={mano === v}
              onClick={() => { setMano(v); setLimit(PAGE); }}
              className={`flex-1 rounded px-3 py-1.5 sm:flex-none ${mano === v ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div data-scroll-x className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
            <tr>
              {COLUMNS.map((c) => {
                const active = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    title={c.title}
                    aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                    className={`px-2 py-2 font-medium sm:px-3 ${c.numeric ? "text-right" : "text-left"} ${c.wide ? "hidden md:table-cell" : ""} ${c.key === "stuff_cdmx_proy" ? "text-accent" : ""}`}
                  >
                    <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-0.5 hover:text-neutral-900">
                      {c.label}
                      <span aria-hidden className={active ? "" : "invisible"}>{sort.dir === 1 ? "↑" : "↓"}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((p) => (
              <Fragment key={p.pitcher_anon_id}>
                <PitcherRow p={p} open={open === p.pitcher_anon_id} onToggle={() => toggleOpen(p.pitcher_anon_id)} />
                {open === p.pitcher_anon_id && (
                  <tr className="bg-neutral-50">
                    <td colSpan={COLUMNS.length} className="px-2 py-4 sm:px-4">
                      <ArsenalPanel pitcher={p} pitches={byPitcher.get(p.pitcher_anon_id) ?? []} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-neutral-500">Ningún pitcher coincide con la búsqueda.</p>}
      </div>

      <div className="mt-3 flex flex-col items-center gap-2 text-sm text-neutral-600 sm:flex-row sm:justify-between">
        <span>
          Mostrando {fmt0(Math.min(limit, rows.length))} de {fmt0(rows.length)}
        </span>
        {limit < rows.length && (
          <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="rounded border border-neutral-300 bg-white px-3 py-1.5 hover:bg-neutral-100">
            Mostrar {fmt0(Math.min(PAGE, rows.length - limit))} más
          </button>
        )}
      </div>
      <p className="mt-4 text-xs text-neutral-500">
        Un guion indica que el pitcher no tiene suficientes lanzamientos en ese tipo de sede. La proyección en gris se
        basa en pocos lanzamientos a nivel del mar.
      </p>
    </>
  );
}

function PitcherRow({ p, open, onToggle }: { p: Pitcher; open: boolean; onToggle: () => void }) {
  const thinProjection = p.stuff_mar == null && p.stuff_cdmx_proy != null;
  const cell = "px-2 py-2 sm:px-3 tabular-nums text-right";
  return (
    <tr
      onClick={onToggle}
      className={`cursor-pointer border-b border-neutral-100 hover:bg-neutral-50 ${open ? "bg-neutral-50" : ""}`}
    >
      <td className="px-2 py-2 sm:px-3">
        <button type="button" aria-expanded={open} className="text-left font-medium text-neutral-900">
          <span aria-hidden className="mr-1 inline-block w-3 text-neutral-400">{open ? "▾" : "▸"}</span>
          {p.pitcher_anon_id.replace("pitcher_", "")}
          <span className="ml-1 text-xs font-normal text-neutral-500 md:hidden">{p.mano === "Left" ? "Z" : "D"}</span>
        </button>
      </td>
      <td className="hidden px-3 py-2 text-neutral-700 md:table-cell">{MANO_LABEL[p.mano]}</td>
      <td className={`${cell} hidden text-neutral-600 md:table-cell`}>{fmt0(p.n)}</td>
      <td className={`${cell} hidden md:table-cell`}>{fmtStuff(p.stuff)}</td>
      <td className={cell}>{fmtStuff(p.stuff_mar)}</td>
      <td className={`${cell} hidden md:table-cell`}>{fmtStuff(p.stuff_media)}</td>
      <td className={`${cell} hidden md:table-cell`}>{fmtStuff(p.stuff_extrema)}</td>
      <td className={`${cell} font-semibold ${thinProjection ? "text-neutral-400" : "text-neutral-900"}`}>{fmtStuff(p.stuff_cdmx_proy)}</td>
      <td className={`${cell} text-neutral-700`}>{fmtSigned(p.delta_cdmx_proy)}</td>
    </tr>
  );
}

function ArsenalPanel({ pitcher, pitches }: { pitcher: Pitcher; pitches: ArsenalPitch[] }) {
  return (
    <div>
      <p className="mb-3 text-sm text-neutral-700">
        Arsenal de <span className="font-medium text-neutral-900">{pitcher.pitcher_anon_id}</span> ({MANO_LABEL[pitcher.mano].toLowerCase()}).
        Movimiento horizontal hacia el lado del brazo.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pitches.map((a) => (
          <li key={a.tipo} className="rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-neutral-900">{TIPO_LABEL[a.tipo]}</span>
              <span className="text-xs text-neutral-500">{fmt0(a.uso * 100)}% de uso</span>
            </div>
            <dl className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
              <Metric k="Stuff+" v={fmtStuff(a.stuff)} strong />
              <Metric k="Δ CDMX" v={fmtSigned(a.delta_cdmx)} strong />
              <Metric k="Velocidad" v={`${fmt1(a.velo)} mph`} />
              <Metric k="IVB" v={`${fmt1(a.ivb)} in`} />
              <Metric k="HB" v={`${fmt1(a.hb)} in`} />
              <Metric k="Giro" v={`${fmt0(a.spin)} rpm`} />
            </dl>
            <Link
              href={`/simulador/?p=${a.pitcher_anon_id}&t=${a.tipo}`}
              className="mt-3 inline-block text-sm font-medium text-accent underline-offset-2 hover:underline"
            >
              Abrir en el simulador →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-neutral-500">{k}</dt>
      <dd className={`tabular-nums ${strong ? "text-base font-semibold text-neutral-900" : "text-neutral-800"}`}>{v}</dd>
    </div>
  );
}
