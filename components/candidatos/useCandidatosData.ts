"use client";

import { useEffect, useState } from "react";
import type { ArsenalRefData, ArsenalValidation } from "@/types/candidatos";

export interface CandidatosData {
  arsenalRef: ArsenalRefData;
  validation: ArsenalValidation;
}

let pending: Promise<CandidatosData> | null = null;

async function getJson<T>(name: string): Promise<T> {
  const res = await fetch(`/data/${name}`);
  if (!res.ok) throw new Error(`No se pudo cargar ${name} (${res.status})`);
  return (await res.json()) as T;
}

/** Igual que los datos generales: se descargan una vez por visita y se reutilizan. */
function load(): Promise<CandidatosData> {
  if (!pending) {
    pending = Promise.all([getJson<ArsenalRefData>("arsenal_ref.json"), getJson<ArsenalValidation>("arsenal_validation.json")])
      .then(([arsenalRef, validation]) => ({ arsenalRef, validation }));
    pending.catch(() => { pending = null; });
  }
  return pending;
}

export function useCandidatosData() {
  const [state, setState] = useState<{ data?: CandidatosData; error?: string }>({});
  useEffect(() => {
    let alive = true;
    load()
      .then((data) => alive && setState({ data }))
      .catch((e: Error) => alive && setState({ error: e.message }));
    return () => { alive = false; };
  }, []);
  return state;
}
