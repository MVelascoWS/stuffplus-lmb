// Estado editable del arsenal: el mismo ArsenalInput de lib/arsenal.ts, con un identificador por fila
// para que React no confunda filas al agregar o quitar lanzamientos.
import { arsenalDeLaLiga, type ArsenalInput, type ArsenalPitch, type ArsenalRow } from "@/lib/arsenal";
import type { ArsenalPitch as ArsenalJsonRow, DashboardMeta } from "@/lib/data";
import { PITCH_TYPES } from "@/lib/data";
import type { PitchType } from "@/lib/simulator";

export const MAX_PITCHES = 6;
export const MIN_PITCHES = 1;

export type DraftPitch = ArsenalPitch & { id: number };
export type Draft = Omit<ArsenalInput, "pitches"> & { pitches: DraftPitch[] };

/**
 * Precisión de lo que se captura, la misma que guarda el link (encodeArsenal): dos decimales en velocidad,
 * movimiento y liberación, uno en el uso, y giro y eje enteros.
 */
export const DECIMALES = { velocidad: 2, movimiento: 2, liberacion: 2, uso: 1, giro: 0, eje: 0 } as const;
export const redondear = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;
const D = DECIMALES;

let nextId = 1;
export const withIds = (a: ArsenalInput): Draft => ({ ...a, pitches: a.pitches.map((p) => ({ ...p, id: nextId++ })) });

/** Uso promedio de cada tipo en los arsenales de la liga, en porcentaje. */
export function usoTipico(arsenal: ArsenalJsonRow[]): Record<PitchType, number> {
  const acc = Object.fromEntries(PITCH_TYPES.map((t) => [t, { s: 0, n: 0 }])) as Record<PitchType, { s: number; n: number }>;
  for (const r of arsenal) { acc[r.tipo].s += r.uso; acc[r.tipo].n += 1; }
  return Object.fromEntries(PITCH_TYPES.map((t) => [t, acc[t].n ? (100 * acc[t].s) / acc[t].n : 0])) as Record<PitchType, number>;
}

/** Valores típicos de la liga para un tipo de lanzamiento. */
export function pitchTipico(meta: DashboardMeta, tipo: PitchType, uso: number): ArsenalPitch {
  const d = meta.defaults[tipo];
  return {
    tipo, uso: redondear(uso, D.uso), RelSpeed: redondear(d.RelSpeed, D.velocidad),
    ivb: redondear(d.ivb, D.movimiento), hb_arm: redondear(d.hb_arm, D.movimiento),
    SpinRate: redondear(d.SpinRate, D.giro), spin_axis_m: redondear(d.spin_axis_m, D.eje),
  };
}

/** Fila nueva con valores típicos de la liga. */
export const nuevoPitch = (meta: DashboardMeta, tipo: PitchType, uso: number): DraftPitch =>
  ({ ...pitchTipico(meta, tipo, uso), id: nextId++ });

/**
 * Arsenal de ejemplo: recta de cuatro costuras, slider y cambio con valores típicos de la liga.
 * El uso es el promedio de la liga para cada tipo, reescalado a enteros que suman 100.
 */
export function ejemplo(meta: DashboardMeta, uso: Record<PitchType, number>): Draft {
  const tipos: PitchType[] = ["Four-Seam", "Slider", "Changeup"];
  const total = tipos.reduce((s, t) => s + uso[t], 0);
  const pcts = tipos.map((t) => Math.round((100 * uso[t]) / total));
  pcts[0] += 100 - pcts.reduce((s, v) => s + v, 0);
  const rel = meta.defaults["Four-Seam"];
  return withIds({
    mano: "Right",
    measuredAt: "No Altitude",
    Extension: redondear(rel.Extension, D.liberacion),
    RelHeight: redondear(rel.RelHeight, D.liberacion),
    rel_side_arm: redondear(rel.rel_side_arm, D.liberacion),
    pitches: tipos.map((t, i) => pitchTipico(meta, t, pcts[i])),
  });
}

/** Arsenal de un pitcher de la LMB, armado igual que la referencia de la liga (arsenal_ref.json). */
export function draftDeLaLiga(id: string, mano: string, arsenal: ArsenalJsonRow[]): Draft {
  const rows = arsenal.filter((r) => r.pitcher_anon_id === id) as unknown as ArsenalRow[];
  return withIds(arsenalDeLaLiga(mano, rows));
}

/** Quita los identificadores de fila: lo que se evalúa y se comparte. */
export const toInput = (d: Draft): ArsenalInput => ({
  ...d,
  pitches: d.pitches.map((p) => {
    const sinId: ArsenalPitch & { id?: number } = { ...p };
    delete sinId.id;
    return sinId;
  }),
});
