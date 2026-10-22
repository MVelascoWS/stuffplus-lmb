"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCalculo } from "@/components/calculo/useCalculo";
import { WithData } from "@/components/DataProvider";
import { Card } from "@/components/ui";
import { decodeArsenal, encodeArsenal, type ArsenalInput } from "@/lib/arsenal";
import type { DashboardData } from "@/lib/data";
import { SEDE_CORTA, fmt0, fmtStuff } from "@/lib/format";
import { conResultados } from "@/types/resultados";
import { ArsenalEditor } from "./ArsenalEditor";
import { ArsenalResultView } from "./ArsenalResultView";
import { Comparison, LETRAS, type Comparado, type Letra } from "./Comparison";
import { draftDeLaLiga, ejemplo, toInput, usoTipico, withIds, type Draft } from "./draft";
import { useCandidatosData, type CandidatosData } from "./useCandidatosData";

export function Candidatos() {
  const params = useSearchParams();
  const extra = useCandidatosData();
  return (
    <WithData>
      {(data) => {
        if (extra.error) {
          return (
            <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              No se pudo cargar la referencia de la liga: {extra.error}. Recarga la página para intentar de nuevo.
            </p>
          );
        }
        if (!extra.data) return <p className="animate-pulse py-12 text-center text-sm text-neutral-500">Cargando datos…</p>;
        return <Evaluador data={data} extra={extra.data} params={params} />;
      }}
    </WithData>
  );
}

interface Inicial { draft: Draft; origen: string | null; comparados: Comparado[] }

/**
 * Un parámetro ?a=, ?b= o ?c= trae un arsenal codificado con encodeArsenal o, para un pitcher de la LMB sin
 * cambios, su ID: así se reconstruye con todos sus decimales y su calificación coincide con la referencia.
 * Un valor inválido devuelve null y se ignora.
 */
function leerParametro(raw: string, data: DashboardData): { input: ArsenalInput; origen: string | null } | null {
  const pitcher = data.pitchers.find((x) => x.pitcher_anon_id === raw);
  if (pitcher) return { input: toInput(draftDeLaLiga(raw, pitcher.mano, data.arsenal)), origen: raw };
  const input = decodeArsenal(raw);
  return input ? { input, origen: null } : null;
}

function desdeUrl(params: URLSearchParams, data: DashboardData, uso: ReturnType<typeof usoTipico>): Inicial {
  const validos: Comparado[] = LETRAS.flatMap((l) => {
    const raw = params.get(l.toLowerCase());
    const leido = raw ? leerParametro(raw, data) : null;
    return leido ? [{ letra: l, ...leido }] : [];
  });
  if (!validos.length) return { draft: ejemplo(data.meta, uso), origen: null, comparados: [] };
  const [primero] = validos;
  return { draft: withIds(primero.input), origen: primero.origen, comparados: validos.length > 1 ? validos : [] };
}

const codificar = (input: ArsenalInput, origen: string | null) => origen ?? encodeArsenal(input);

/** Lo que va en la URL: los comparados como a, b y c; si no hay comparación, el arsenal actual en a. */
function query(draft: Draft, origen: string | null, comparados: Comparado[]): string {
  if (comparados.length) return comparados.map((c) => `${c.letra.toLowerCase()}=${codificar(c.input, c.origen)}`).join("&");
  return `a=${codificar(toInput(draft), origen)}`;
}

function Evaluador({ data, extra, params }: { data: DashboardData; extra: CandidatosData; params: URLSearchParams }) {
  const meta = useMemo(() => conResultados(data.meta), [data.meta]);
  const uso = useMemo(() => usoTipico(data.arsenal), [data.arsenal]);
  const [inicial] = useState(() => desdeUrl(params, data, uso));
  const [draft, setDraft] = useState<Draft>(inicial.draft);
  const [origen, setOrigen] = useState<string | null>(inicial.origen);
  const [comparados, setComparados] = useState<Comparado[]>(inicial.comparados);
  const [copiado, setCopiado] = useState(false);

  // Los arsenales se califican en un worker: editar no bloquea la página aunque haya tres en comparación.
  const ctx = useMemo(() => ({ model: data.model, meta: data.meta, ref: extra.arsenalRef }), [data.model, data.meta, extra.arsenalRef]);
  const actual = useMemo(() => toInput(draft), [draft]);
  const result = useCalculo({ kind: "arsenal", inputs: [actual] }, ctx).valor![0];
  const comparacion = useCalculo({ kind: "arsenal", inputs: comparados.map((c) => c.input) }, ctx, false);
  const minN = useMemo(() => Math.min(...data.pitchers.map((p) => p.n)), [data.pitchers]);
  const ids = useMemo(() => data.pitchers.map((p) => p.pitcher_anon_id).sort(), [data.pitchers]);

  // La URL refleja lo capturado, así recargar o copiar el link conserva el trabajo.
  useEffect(() => {
    const t = setTimeout(() => {
      window.history.replaceState(null, "", `${window.location.pathname}?${query(draft, origen, comparados)}`);
    }, 300);
    return () => clearTimeout(t);
  }, [draft, origen, comparados]);

  const edit = (d: Draft) => { setDraft(d); setOrigen(null); setCopiado(false); };
  const cargarPitcher = (id: string) => {
    const p = data.pitchers.find((x) => x.pitcher_anon_id === id);
    if (!p) return;
    setDraft(draftDeLaLiga(id, p.mano, data.arsenal));
    setOrigen(id);
  };
  const libre = LETRAS.find((l) => !comparados.some((c) => c.letra === l));
  const agregar = () => {
    if (!libre) return;
    const nuevo: Comparado = { letra: libre, input: toInput(draft), origen };
    setComparados((cs) => [...cs, nuevo].sort((a, b) => a.letra.localeCompare(b.letra)));
  };
  const quitar = (l: Letra) => setComparados((cs) => cs.filter((c) => c.letra !== l));
  const editarComparado = (l: Letra) => {
    const c = comparados.find((x) => x.letra === l);
    if (c) { setDraft(withIds(c.input)); setOrigen(c.origen); }
  };
  const copiar = async () => {
    const url = `${window.location.origin}${window.location.pathname}?${query(draft, origen, comparados)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch {
      window.prompt("Copia este link:", url);
    }
  };

  return (
    <div className="pb-16 lg:pb-0">
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="block text-sm text-neutral-800 sm:max-w-xs sm:flex-1">
          Cargar un pitcher de la LMB como ejemplo
          <select
            value={origen ?? ""}
            onChange={(e) => e.target.value && cargarPitcher(e.target.value)}
            className="mt-1 block w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">Elegir pitcher anónimo…</option>
            {ids.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button" onClick={agregar} disabled={!libre}
            className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {libre ? `Agregar a la comparación (${libre})` : "Comparación llena"}
          </button>
          <button type="button" onClick={copiar} className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800">
            {copiado ? "Link copiado" : "Copiar link"}
          </button>
        </div>
      </div>

      <ArsenalEditor draft={draft} meta={data.meta} usoTipico={uso} onChange={edit} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <ArsenalResultView result={result} meta={meta} minN={minN} />
        <div className="min-w-0 space-y-6">
          {comparados.length > 0 ? (
            comparacion.valor && !comparacion.calculando ? (
              <Comparison items={comparados} results={comparacion.valor} onRemove={quitar} onEdit={editarComparado} />
            ) : (
              <Card><p className="animate-pulse text-sm text-neutral-500">Calculando la comparación…</p></Card>
            )
          ) : (
            <Card>
              <p className="text-sm text-neutral-600">
                Usa “Agregar a la comparación” para guardar este arsenal y comparar hasta tres candidatos lado a lado.
              </p>
            </Card>
          )}
        </div>
      </div>

      <ValidationNote v={extra.validation} />

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white/95 px-4 py-2 backdrop-blur lg:hidden">
        <p className="mx-auto max-w-6xl text-center text-sm text-neutral-700">
          {SEDE_CORTA["Harp Helu"]}:{" "}
          <span className="text-lg font-semibold tabular-nums text-neutral-900">{fmtStuff(result.stuff["Harp Helu"])}</span>{" "}
          · percentil {fmt0(result.percentil["Harp Helu"])}
        </p>
      </div>
    </div>
  );
}

function ValidationNote({ v }: { v: CandidatosData["validation"] }) {
  const real = v.vs_resultado_real;
  const [lo] = real.mejora_ic95;
  let contraReal: string;
  if (real.proyeccion <= real.ingenuo) {
    contraReal = "Contra las carreras reales todavía no mejora a ese supuesto.";
  } else if (lo > 0) {
    contraReal = `Contra las carreras reales apunta en la misma dirección, y con ${fmt0(v.n_pitchers)} pitchers la mejora es estadísticamente significativa.`;
  } else {
    contraReal = `Contra las carreras reales apunta en la misma dirección, pero con ${fmt0(v.n_pitchers)} pitchers la mejora todavía no es estadísticamente concluyente.`;
  }
  return (
    <p className="mt-8 border-t border-neutral-200 pt-4 text-xs leading-relaxed text-neutral-600">
      Con pitchers que el modelo no vio, el simulador anticipa el Stuff+ de su arsenal en altitud con{" "}
      {fmt0(v.reduccion_error_pct)}% menos error que suponer que rinde igual. {contraReal} Stuff+ no mide comando: para
      candidatos con muchos lanzamientos registrados, véalo junto con sus resultados.
    </p>
  );
}
