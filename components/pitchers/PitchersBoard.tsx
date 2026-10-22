"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useDashboardData } from "@/components/DataProvider";
import { IcoCandidato, IcoFlecha } from "@/components/consola/Iconos";
import { Kpis, Panel, Segmentado } from "@/components/consola/Panel";
import { Cargando, ErrorDatos, Vista } from "@/components/consola/Vista";
import { PROJECTION_ANCHOR } from "@/components/modelo/ProjectionCheck";
import type { ArsenalPitch, DashboardData, Pitcher } from "@/lib/data";
import { MANO_LABEL, TIPO_LABEL, fmt0, fmt1, fmtSigned, fmtStuff } from "@/lib/format";
import { conResultados } from "@/types/resultados";

type SortKey = "pitcher_anon_id" | "mano" | "n" | "stuff" | "stuff_mar" | "stuff_media" | "stuff_extrema" | "stuff_cdmx_proy" | "delta_cdmx_proy";
type Mano = "all" | "Right" | "Left";

const PAGE = 25;
const TITULO = "Pitchers";
const DESCRIPCION = "¿Quién viaja bien a la CDMX? Stuff+ de cada pitcher por sede y proyectado en el Harp Helú.";

/** Columnas de la tabla. Las marcadas como `wide` se ocultan en pantallas angostas. */
const COLUMNS: { key: SortKey; label: string; title?: string; numeric?: boolean; wide?: boolean; hh?: boolean }[] = [
  { key: "pitcher_anon_id", label: "Pitcher" },
  { key: "mano", label: "Mano", wide: true },
  { key: "n", label: "Lanz.", title: "Lanzamientos registrados", numeric: true, wide: true },
  { key: "stuff", label: "Global", title: "Stuff+ en todas las sedes", numeric: true, wide: true },
  { key: "stuff_mar", label: "Mar", title: "Stuff+ en sedes sin altitud", numeric: true },
  { key: "stuff_media", label: "Media", title: "Stuff+ en sedes de altitud media", numeric: true, wide: true },
  { key: "stuff_extrema", label: "Extrema", title: "Stuff+ en sedes de altitud extrema", numeric: true, wide: true },
  { key: "stuff_cdmx_proy", label: "CDMX", title: "Stuff+ proyectado en el Harp Helú", numeric: true, hh: true },
  { key: "delta_cdmx_proy", label: "Δ", title: "Cambio proyectado: CDMX menos nivel del mar", numeric: true },
];

export function PitchersBoard() {
  const initial = useSearchParams().get("p");
  const estado = useDashboardData();
  if (estado.status !== "ready") {
    return (
      <Vista titulo={TITULO} descripcion={DESCRIPCION}>
        {estado.status === "error" ? <ErrorDatos mensaje={estado.message} /> : <Cargando />}
      </Vista>
    );
  }
  return <Board data={estado.data} initial={initial} />;
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

/** Una proyección basada en pocos lanzamientos a nivel del mar (sin Stuff+ a nivel del mar) se muestra atenuada. */
const proyeccionDebil = (p: Pitcher) => p.stuff_mar == null && p.stuff_cdmx_proy != null;

function Board({ data, initial }: { data: DashboardData; initial: string | null }) {
  const { pitchers, arsenal } = data;
  const [query, setQuery] = useState("");
  const [mano, setMano] = useState<Mano>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "stuff_cdmx_proy", dir: -1 });
  // Si el pitcher abierto con ?p= no está en la primera página del orden inicial, se muestra hasta él.
  const [limit, setLimit] = useState(() => {
    const i = initial ? [...pitchers].sort((x, y) => compare(x, y, "stuff_cdmx_proy", -1)).findIndex((p) => p.pitcher_anon_id === initial) : -1;
    return i >= PAGE ? Math.ceil((i + 1) / PAGE) * PAGE : PAGE;
  });
  const [open, setOpen] = useState<string | null>(initial);
  const lateral = useRef<HTMLDivElement>(null);

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

  // Indicadores de la tabla. Las proyecciones con pocos lanzamientos a nivel del mar no compiten.
  const kpi = useMemo(() => {
    const conMar = pitchers.filter((p) => p.stuff_cdmx_proy != null && p.delta_cdmx_proy != null && !proyeccionDebil(p));
    const max = (f: (p: Pitcher) => number) => conMar.reduce((m, p) => (f(p) > f(m) ? p : m));
    const min = (f: (p: Pitcher) => number) => conMar.reduce((m, p) => (f(p) < f(m) ? p : m));
    return {
      minN: Math.min(...pitchers.map((p) => p.n)),
      mejor: max((p) => p.stuff_cdmx_proy!),
      gana: max((p) => p.delta_cdmx_proy!),
      pierde: min((p) => p.delta_cdmx_proy!),
    };
  }, [pitchers]);

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "pitcher_anon_id" || key === "mano" ? 1 : -1 }));
    setLimit(PAGE);
  };
  const elegir = (id: string) => {
    const next = open === id ? null : id;
    setOpen(next);
    // La URL refleja el pitcher abierto para poder compartir el enlace.
    window.history.replaceState(null, "", next ? `?p=${next}` : window.location.pathname);
    // En pantallas angostas el panel lateral queda debajo de la tabla: se lleva a la vista.
    if (next && window.matchMedia("(max-width: 1100px)").matches) {
      requestAnimationFrame(() => lateral.current?.scrollIntoView({ block: "start" }));
    }
  };
  const abierto = open ? pitchers.find((p) => p.pitcher_anon_id === open) ?? null : null;
  const validacion = conResultados(data.meta).projection_validation;

  return (
    <Vista titulo={TITULO} descripcion={DESCRIPCION}>
      <Panel ancho={12} titulo="La liga en el Harp Helú" meta="Stuff+ proyectado: lanzamientos a nivel del mar trasladados al Harp Helú y calificados de nuevo">
        <Kpis
          items={[
            { k: "Pitchers en la tabla", v: fmt0(pitchers.length), d: `Con al menos ${fmt0(kpi.minN)} lanzamientos` },
            { k: "Mejor Stuff+ proyectado en CDMX", v: fmtStuff(kpi.mejor.stuff_cdmx_proy), tono: "r", d: kpi.mejor.pitcher_anon_id },
            { k: "Mayor ganancia al llegar a CDMX", v: fmtSigned(kpi.gana.delta_cdmx_proy), d: kpi.gana.pitcher_anon_id },
            { k: "Mayor pérdida al llegar a CDMX", v: fmtSigned(kpi.pierde.delta_cdmx_proy), d: kpi.pierde.pitcher_anon_id },
          ]}
        />
      </Panel>

      <Panel
        ancho={8}
        titulo="Stuff+ por sede"
        meta={`${fmt0(rows.length)} pitchers; toca uno para ver su arsenal`}
        controles={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search" placeholder="Buscar pitcher (ej. 00952)" aria-label="Buscar pitcher"
              className="ctl w-full sm:w-52" value={query}
              onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
            />
            <Segmentado
              etiqueta="Filtrar por mano" valor={mano} onChange={(v) => { setMano(v); setLimit(PAGE); }}
              opciones={[{ value: "all", label: "Todos" }, { value: "Right", label: "Derechos" }, { value: "Left", label: "Zurdos" }]}
            />
          </div>
        }
        pie={
          <>
            Proyección validada: con pitchers que el modelo no vio, anticipa su Stuff+ en altitud con{" "}
            {fmt0(validacion.reduccion_error_pct)}% menos error que suponer que rinden igual.{" "}
            <Link href={`/modelo/#${PROJECTION_ANCHOR}`} className="font-semibold text-tinta underline underline-offset-2">Ver la validación</Link>.
            Un guion indica pocos lanzamientos en ese tipo de sede; la proyección atenuada se basa en pocos lanzamientos a nivel del mar.
          </>
        }
      >
        <div data-scroll-x className="overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                {COLUMNS.map((c) => {
                  const active = sort.key === c.key;
                  return (
                    <th
                      key={c.key} scope="col" title={c.title}
                      aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                      className={`${c.numeric ? "n" : ""} ${c.wide ? "hidden md:table-cell" : ""} ${c.hh ? "hh" : ""}`}
                    >
                      <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-0.5">
                        {c.label}
                        <span aria-hidden className={active ? "" : "invisible"}>{sort.dir === 1 ? "↑" : "↓"}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((p) => {
                const sel = open === p.pitcher_anon_id;
                return (
                  <tr key={p.pitcher_anon_id} onClick={() => elegir(p.pitcher_anon_id)} className={`cursor-pointer ${sel ? "bg-lienzo" : "hover:bg-[#faf9f8]"}`}>
                    <td className={sel ? "shadow-[inset_3px_0_0_var(--tinta)]" : ""}>
                      <button type="button" aria-pressed={sel} className="text-left font-semibold" onClick={(e) => { e.stopPropagation(); elegir(p.pitcher_anon_id); }}>
                        {p.pitcher_anon_id.replace("pitcher_", "")}
                        <span className="ml-1 text-xs font-normal text-grafito md:hidden">{p.mano === "Left" ? "Z" : "D"}</span>
                      </button>
                    </td>
                    <td className="hidden text-grafito md:table-cell">{MANO_LABEL[p.mano]}</td>
                    <td className="n tenue hidden md:table-cell">{fmt0(p.n)}</td>
                    <td className="n hidden md:table-cell">{fmtStuff(p.stuff)}</td>
                    <td className="n">{fmtStuff(p.stuff_mar)}</td>
                    <td className="n hidden md:table-cell">{fmtStuff(p.stuff_media)}</td>
                    <td className="n hidden md:table-cell">{fmtStuff(p.stuff_extrema)}</td>
                    <td className={`n hh ${proyeccionDebil(p) ? "opacity-50" : ""}`}>{fmtStuff(p.stuff_cdmx_proy)}</td>
                    <td className="n">{fmtSigned(p.delta_cdmx_proy)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="pb text-center text-sm text-grafito">Ningún pitcher coincide con la búsqueda.</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-linea px-[18px] py-3 text-[13px] text-grafito">
          <span>Mostrando {fmt0(Math.min(limit, rows.length))} de {fmt0(rows.length)}</span>
          {limit < rows.length && (
            <button type="button" className="btn" onClick={() => setLimit((l) => l + PAGE)}>
              Mostrar {fmt0(Math.min(PAGE, rows.length - limit))} más
            </button>
          )}
        </div>
      </Panel>

      <div ref={lateral} className="c4 min-w-0 scroll-mt-4 lg:sticky lg:top-[96px]">
        {abierto ? (
          <Arsenal pitcher={abierto} pitches={byPitcher.get(abierto.pitcher_anon_id) ?? []} />
        ) : (
          <section className="panel">
            <div className="ph"><h2>Arsenal</h2></div>
            <p className="pb m-0 text-sm text-grafito">Elige un pitcher de la tabla para ver su arsenal y abrirlo en el simulador o evaluarlo como candidato.</p>
          </section>
        )}
      </div>
    </Vista>
  );
}

function Arsenal({ pitcher, pitches }: { pitcher: Pitcher; pitches: ArsenalPitch[] }) {
  return (
    <section className="panel" aria-labelledby="arsenal-t">
      <div className="ph">
        <div className="min-w-0">
          <h2 id="arsenal-t">{pitcher.pitcher_anon_id}</h2>
          <span className="meta">{MANO_LABEL[pitcher.mano]}, {fmt0(pitcher.n)} lanzamientos; HB hacia el lado del brazo</span>
        </div>
        <Link href={`/candidatos/?a=${pitcher.pitcher_anon_id}`} className="btn prim"><IcoCandidato />Evaluar como candidato</Link>
      </div>
      <ul className="m-0 list-none p-0">
        {pitches.map((a) => (
          <li key={a.tipo} className="border-b border-linea px-[18px] py-3 last:border-b-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{TIPO_LABEL[a.tipo]}</span>
              <span className="text-xs text-grafito">{fmt0(a.uso * 100)}% de uso</span>
            </div>
            <dl className="mt-2 grid grid-cols-4 gap-x-2 gap-y-1 text-xs">
              <Dato k="Stuff+" v={fmtStuff(a.stuff)} grande />
              <Dato k="Δ CDMX" v={fmtSigned(a.delta_cdmx)} grande />
              <Dato k="mph" v={fmt1(a.velo)} />
              <Dato k="rpm" v={fmt0(a.spin)} />
              <Dato k="IVB (in)" v={fmt1(a.ivb)} />
              <Dato k="HB (in)" v={fmt1(a.hb)} />
            </dl>
            <Link href={`/simulador/?p=${a.pitcher_anon_id}&t=${a.tipo}`} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold underline-offset-2 hover:underline">
              Abrir en simulador <IcoFlecha />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Dato({ k, v, grande }: { k: string; v: string; grande?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-grafito">{k}</dt>
      <dd className={`num m-0 ${grande ? "text-[22px] font-bold leading-tight" : "text-[15px] font-semibold"}`}>{v}</dd>
    </div>
  );
}
