// Tipos de los archivos que usa la vista de candidatos (pipeline/10_arsenal.py y scripts/build-arsenal-ref.ts).
import type { ArsenalRef } from "@/lib/arsenal";

/** arsenal_ref.json: la referencia de la liga más la calificación de cada pitcher, por sede. */
export type ArsenalRefData = ArsenalRef & { porPitcher: Record<string, Record<string, number>> };

/** arsenal_validation.json: el evaluador de arsenal probado con pitchers que el modelo no vio. */
export interface ArsenalValidation {
  n_pitchers: number;
  /** suponer que el arsenal rinde en altitud igual que a nivel del mar */
  ingenuo: { corr: number; mae: number };
  proyeccion: { corr: number; mae: number };
  cambio_corr: number;
  /** correlación con las carreras realmente permitidas en altitud */
  vs_resultado_real: { ingenuo: number; proyeccion: number; techo: number; mejora_ic95: [number, number] };
  reduccion_error_pct: number;
}
