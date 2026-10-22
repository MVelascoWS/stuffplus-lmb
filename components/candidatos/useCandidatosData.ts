"use client";

import { useJson } from "@/components/useJson";
import type { ArsenalRefData, ArsenalValidation } from "@/types/candidatos";

export interface CandidatosData {
  arsenalRef: ArsenalRefData;
  validation: ArsenalValidation;
}

/** La referencia de la liga y la validación del evaluador, descargadas una vez por visita. */
export function useCandidatosData(): { data?: CandidatosData; error?: string } {
  const ref = useJson<ArsenalRefData>("arsenal_ref.json");
  const val = useJson<ArsenalValidation>("arsenal_validation.json");
  const error = ref.error ?? val.error;
  if (error) return { error };
  return ref.data && val.data ? { data: { arsenalRef: ref.data, validation: val.data } } : {};
}
