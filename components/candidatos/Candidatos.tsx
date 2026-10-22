"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCalculo } from "@/components/calculo/useCalculo";
import { useDashboardData } from "@/components/DataProvider";
import { IcoLink, IcoMas } from "@/components/consola/Iconos";
import { Cargando, ErrorDatos, Vista } from "@/components/consola/Vista";
import { decodeArsenal, encodeArsenal, type ArsenalInput } from "@/lib/arsenal";
import type { DashboardData } from "@/lib/data";
import { fmt0 } from "@/lib/format";
import { conResultados } from "@/types/resultados";
import { ArsenalEditor } from "./ArsenalEditor";
import { ArsenalResultView } from "./ArsenalResultView";
import { Comparison, LETRAS, type Comparado, type Letra } from "./Comparison";
import { draftDeLaLiga, ejemplo, toInput, usoTipico, withIds, type Draft } from "./draft";
import { useCandidatosData, type CandidatosData } from "./useCandidatosData";

const TITULO = "Evaluar candidato";
const DESCRIPCION = "Califica el arsenal completo de un pitcher de cualquier liga en el Harp Helú y ubícalo frente a la LMB.";

export function Candidatos() {
  const params = useSearchParams();
  const estado = useDashboardData();
  const extra = useCandidatosData();
  const error = estado.status === "error" ? estado.message : extra.error;
  if (estado.status !== "ready" || !extra.data) {
    return <Vista titulo={TITULO} descripcion={DESCRIPCION}>{error ? <ErrorDatos mensaje={error} /> : <Cargando />}</Vista>;
  }
  return <Evaluador data={estado.data} extra={extra.data} params={params} />;
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
    <Vista
      titulo={TITULO}
      descripcion={DESCRIPCION}
      acciones={
        <>
          <select
            className="ctl w-auto max-w-full" aria-label="Cargar pitcher de la LMB"
            value={origen ?? ""} onChange={(e) => e.target.value && cargarPitcher(e.target.value)}
          >
            <option value="">Cargar pitcher de la LMB…</option>
            {ids.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
          <button type="button" className="btn" onClick={agregar} disabled={!libre}>
            <IcoMas />{libre ? `Agregar a la comparación (${libre})` : "Comparación llena"}
          </button>
          <button type="button" className="btn prim" onClick={copiar}><IcoLink />{copiado ? "Link copiado" : "Copiar link"}</button>
        </>
      }
    >
      <ArsenalEditor draft={draft} meta={data.meta} usoTipico={uso} onChange={edit} />
      <ArsenalResultView result={result} meta={meta} minN={minN} pie={<NotaValidacion v={extra.validation} />} />
      <Comparison
        items={comparados}
        results={comparacion.valor && !comparacion.calculando ? comparacion.valor : null}
        onRemove={quitar} onEdit={editarComparado} nLiga={extra.arsenalRef.n}
      />
    </Vista>
  );
}

function NotaValidacion({ v }: { v: CandidatosData["validation"] }) {
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
    <>
      Con pitchers que el modelo no vio, el simulador anticipa el Stuff+ de su arsenal en altitud con{" "}
      {fmt0(v.reduccion_error_pct)}% menos error que suponer que rinde igual. {contraReal} Stuff+ no mide comando: para
      candidatos con muchos lanzamientos registrados, véalo junto con sus resultados.
    </>
  );
}
