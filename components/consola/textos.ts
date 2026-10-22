// Textos de la consola que dependen del tipo de lanzamiento o de la sede.
import type { PitchType, SedeKey } from "@/lib/simulator";

/** "Sliders de la LMB", "331 cambios": plural en minúsculas para frases. */
export const TIPO_PLURAL: Record<PitchType, string> = {
  "Four-Seam": "rectas de 4 costuras",
  Sinker: "sinkers",
  Slider: "sliders",
  Changeup: "cambios",
  Curveball: "curvas",
  Cutter: "cutters",
};

/** Opciones cortas para selectores segmentados de sede. */
export const SEDE_SEG: Record<SedeKey, string> = {
  "No Altitude": "Sin altitud",
  "Medium Altitude": "Media",
  "Extreme Altitude": "Extrema",
  "Harp Helu": "Harp Helú",
};

export const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
