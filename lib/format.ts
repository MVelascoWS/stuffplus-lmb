// Etiquetas en español y formato numérico común a todas las vistas.
// Stuff+ sin decimales; pulgadas y mph con un decimal.
import type { PitchType, SedeKey } from "./simulator";

export const TIPO_LABEL: Record<PitchType, string> = {
  "Four-Seam": "Recta de 4 costuras",
  Sinker: "Sinker",
  Slider: "Slider",
  Changeup: "Cambio",
  Curveball: "Curva",
  Cutter: "Cutter",
};

export const TIPO_CORTO: Record<PitchType, string> = {
  "Four-Seam": "Recta 4C",
  Sinker: "Sinker",
  Slider: "Slider",
  Changeup: "Cambio",
  Curveball: "Curva",
  Cutter: "Cutter",
};

/** "esta recta", "este slider": para frases generadas a partir del tipo. */
export const TIPO_CON_DEMOSTRATIVO: Record<PitchType, string> = {
  "Four-Seam": "esta recta de 4 costuras",
  Sinker: "este sinker",
  Slider: "este slider",
  Changeup: "este cambio",
  Curveball: "esta curva",
  Cutter: "este cutter",
};

export const MANO_LABEL = { Right: "Derecho", Left: "Zurdo" } as const;

/** Nombre corto de cada sede para encabezados y ejes; el nombre completo viene de meta.json. */
export const SEDE_CORTA: Record<SedeKey, string> = {
  "No Altitude": "Sin altitud",
  "Medium Altitude": "Altitud media",
  "Extreme Altitude": "Altitud extrema",
  "Harp Helu": "Harp Helú",
};

const nf = (digits: number) =>
  new Intl.NumberFormat("es-MX", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const n0 = nf(0), n1 = nf(1), n2 = nf(2);

export const fmtStuff = (v: number | null | undefined) => (v == null ? "—" : n0.format(v));
export const fmt0 = (v: number) => n0.format(v);
export const fmt1 = (v: number) => n1.format(v);
export const fmt2 = (v: number) => n2.format(v);

/** Con signo explícito: +4, −3. */
export function fmtSigned(v: number | null | undefined, digits = 0): string {
  if (v == null) return "—";
  const s = nf(digits).format(Math.abs(v));
  if (Number(s.replace(/,/g, "")) === 0) return s;
  return (v > 0 ? "+" : "−") + s;
}

/** Porcentaje con signo a partir de un valor ya expresado en puntos porcentuales. */
export const fmtPct = (v: number, digits = 1) => `${fmtSigned(v, digits)}%`;

/** Metros con separador de miles, redondeados a la decena si se pide. */
export const fmtMeters = (m: number, roundTo = 1) => `${n0.format(Math.round(m / roundTo) * roundTo)} m`;
