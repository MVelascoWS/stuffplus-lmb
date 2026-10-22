"use client";

// Cálculos de Stuff+ en un Web Worker compartido. Cada componente pide el resultado de lo que tiene capturado;
// si llegan cambios mientras el worker trabaja, solo se calcula el más reciente. Si el navegador no puede usar
// el worker, el cálculo se hace en el hilo principal con las mismas funciones.
import { useEffect, useRef, useState } from "react";
import { evaluateArsenal, type ArsenalInput, type ArsenalRef, type ArsenalResult } from "@/lib/arsenal";
import { simulate, type Meta, type PitchInput, type SedeKey, type SedeResult } from "@/lib/simulator";
import type { StuffModel } from "@/lib/stuffModel";

export type Trabajo =
  | { kind: "simulate"; input: PitchInput; measuredAt: SedeKey }
  | { kind: "arsenal"; inputs: ArsenalInput[] };
type Resultado<T extends Trabajo> = T extends { kind: "simulate" } ? SedeResult[] : ArsenalResult[];

export interface Contexto { model: StuffModel; meta: Meta; ref?: ArsenalRef }

let worker: Worker | null = null;
let roto = false;
let refEnviada: ArsenalRef | undefined;
let seq = 0;
const esperando = new Map<number, (r: unknown) => void>();

function obtenerWorker({ model, meta, ref }: Contexto): Worker | null {
  if (roto || typeof Worker === "undefined") return null;
  if (!worker) {
    try {
      worker = new Worker(new URL("./stuff.worker.ts", import.meta.url));
    } catch {
      roto = true;
      return null;
    }
    worker.onmessage = (e: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
      const cb = esperando.get(e.data.id);
      esperando.delete(e.data.id);
      cb?.(e.data.error ? undefined : e.data.result);
    };
    worker.onerror = () => {
      // Sin worker se sigue calculando en el hilo principal; los pendientes se liberan sin resultado.
      roto = true;
      worker?.terminate();
      worker = null;
      for (const cb of esperando.values()) cb(undefined);
      esperando.clear();
    };
    worker.postMessage({ kind: "init", model, meta });
  }
  if (ref && ref !== refEnviada) {
    worker.postMessage({ kind: "ref", ref });
    refEnviada = ref;
  }
  return worker;
}

function calcularAqui<T extends Trabajo>(t: T, { model, meta, ref }: Contexto): Resultado<T> {
  return (t.kind === "simulate"
    ? simulate(model, meta, t.input, t.measuredAt)
    : t.inputs.map((a) => evaluateArsenal(model, { ...meta, arsenal_ref: ref }, a))) as Resultado<T>;
}

/**
 * Resultado del último trabajo pedido. `trabajo` es el que lo produjo (puede ir un paso atrás de lo capturado)
 * y `calculando` indica que hay uno más reciente en camino. Con `inicialAqui` el primer resultado se calcula
 * en el hilo principal para no mostrar la vista vacía.
 */
export function useCalculo<T extends Trabajo>(trabajo: T, ctx: Contexto, inicialAqui = true) {
  const key = JSON.stringify(trabajo);
  const [estado, setEstado] = useState<{ key: string; trabajo: T; valor: Resultado<T> | null }>(() =>
    inicialAqui ? { key, trabajo, valor: calcularAqui(trabajo, ctx) } : { key: "", trabajo, valor: null });
  const enCurso = useRef(false);
  const siguiente = useRef<{ key: string; trabajo: T } | null>(null);
  const ultimo = useRef({ trabajo, ctx });
  // Se actualiza antes del efecto principal (los efectos corren en orden).
  useEffect(() => { ultimo.current = { trabajo, ctx }; });

  useEffect(() => {
    if (estado.key === key) return;
    const w = obtenerWorker(ultimo.current.ctx);
    const pedir = (k: string, t: T) => {
      const actual = obtenerWorker(ultimo.current.ctx);
      if (!actual) {
        setEstado({ key: k, trabajo: t, valor: calcularAqui(t, ultimo.current.ctx) });
        return;
      }
      enCurso.current = true;
      const id = ++seq;
      esperando.set(id, (r) => {
        enCurso.current = false;
        if (r !== undefined) setEstado({ key: k, trabajo: t, valor: r as Resultado<T> });
        else setEstado({ key: k, trabajo: t, valor: calcularAqui(t, ultimo.current.ctx) });
        const s = siguiente.current;
        if (s) { siguiente.current = null; pedir(s.key, s.trabajo); }
      });
      actual.postMessage({ id, ...t });
    };
    if (!w) { setEstado({ key, trabajo, valor: calcularAqui(trabajo, ctx) }); return; }
    if (enCurso.current) siguiente.current = { key, trabajo };
    else pedir(key, trabajo);
    // Solo importa la clave: el trabajo y el contexto vigentes se leen de `ultimo`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { valor: estado.valor, trabajo: estado.trabajo, calculando: estado.key !== key };
}
