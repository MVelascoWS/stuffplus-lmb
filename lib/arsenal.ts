// Evaluador de arsenal: califica el repertorio completo de un pitcher en cada sede.
// Se construye sobre simulate() (lib/simulator.ts), que ya esta verificado contra Python.
import type { StuffModel } from "./stuffModel";
import { simulate, type Meta, type PitchInput, type PitchType, type SedeKey } from "./simulator";

/** Un lanzamiento del arsenal. Lo horizontal, siempre hacia el lado del brazo (zurdos ya espejeados). */
export interface ArsenalPitch {
  tipo: PitchType;
  /** porcentaje de uso; se normaliza para que el arsenal sume 100 */
  uso: number;
  RelSpeed: number; ivb: number; hb_arm: number; SpinRate: number; spin_axis_m: number;
  /** opcionales: si faltan se usan los del pitcher */
  Extension?: number; RelHeight?: number; rel_side_arm?: number;
  measuredAt?: SedeKey;
}

export interface ArsenalInput {
  mano: "Right" | "Left";
  /** liberacion del pitcher (casi igual en todos sus lanzamientos) */
  Extension: number; RelHeight: number; rel_side_arm: number;
  /** donde se midieron los datos (aplica a todos los lanzamientos que no indiquen otra sede) */
  measuredAt: SedeKey;
  pitches: ArsenalPitch[];
}

export interface ArsenalPitchResult {
  tipo: PitchType; uso: number; esRecta: boolean;
  stuff: Record<SedeKey, number>;
  /** movimiento total en pulgadas por sede */
  movimiento: Record<SedeKey, number>;
}

export interface ArsenalResult {
  /** el lanzamiento que funciona como recta principal (los demas se comparan contra el) */
  recta: PitchType;
  pitches: ArsenalPitchResult[];
  /** Stuff+ del arsenal (promedio ponderado por uso) por sede */
  stuff: Record<SedeKey, number>;
  /** % de los pitchers de la LMB (>=300 lanz.) con calificacion menor, por sede */
  percentil: Record<SedeKey, number>;
}

export interface ArsenalRef {
  /** calificaciones de arsenal de los pitchers de la liga, ordenadas de menor a mayor, por sede */
  scores: Record<string, number[]>;
  n: number;
}

export const SEDES_ARSENAL: SedeKey[] = ["No Altitude", "Medium Altitude", "Harp Helu"];
const FASTBALLS: PitchType[] = ["Four-Seam", "Sinker"];

const factor = (meta: Meta, tipo: string, rhoRatio: number) =>
  Math.pow(rhoRatio, meta.physics.p_magnus_tipo[tipo] ?? meta.physics.p_magnus_global);

/**
 * Recta principal: la mas usada entre Four-Seam y Sinker; si no hay, el Cutter; si no, la mas rapida.
 * Es la misma regla con la que se calcularon los diferenciales al entrenar el modelo.
 */
export function rectaPrincipal(pitches: ArsenalPitch[]): number {
  const idx = pitches.map((p, i) => ({ p, i }));
  const fb = idx.filter(({ p }) => FASTBALLS.includes(p.tipo)).sort((a, b) => b.p.uso - a.p.uso);
  if (fb.length) return fb[0].i;
  const ct = idx.filter(({ p }) => p.tipo === "Cutter").sort((a, b) => b.p.uso - a.p.uso);
  if (ct.length) return ct[0].i;
  return idx.sort((a, b) => b.p.RelSpeed - a.p.RelSpeed)[0].i;
}

function percentilEn(sorted: number[], v: number): number {
  let lo = 0, hi = sorted.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < v) lo = m + 1; else hi = m; }
  return Math.round((100 * lo) / sorted.length);
}

export function evaluateArsenal(
  model: StuffModel, meta: Meta & { arsenal_ref?: ArsenalRef }, a: ArsenalInput,
  sedes: SedeKey[] = SEDES_ARSENAL,
): ArsenalResult {
  if (!a.pitches.length) throw new Error("El arsenal no tiene lanzamientos");
  // pesos por uso; si nadie capturo uso, todos pesan igual
  const total = a.pitches.reduce((s, p) => s + Math.max(0, p.uso || 0), 0);
  const w = a.pitches.map((p) => (total > 0 ? Math.max(0, p.uso || 0) / total : 1 / a.pitches.length));

  // 1. cada lanzamiento a "nivel del mar" con su propia sede de medicion
  const mar = a.pitches.map((p) => {
    const r0 = meta.sedes[p.measuredAt ?? a.measuredAt].rho_ratio;
    const f = factor(meta, p.tipo, r0);
    return { ...p, ivb: p.ivb / f, hb_arm: p.hb_arm / f };
  });
  const iFb = rectaPrincipal(a.pitches);
  const fb = mar[iFb];

  // 2. cada lanzamiento se califica contra la recta del mismo arsenal
  const pitches: ArsenalPitchResult[] = mar.map((p, i) => {
    const input: PitchInput = {
      tipo: p.tipo, RelSpeed: p.RelSpeed, ivb: p.ivb, hb_arm: p.hb_arm, SpinRate: p.SpinRate,
      spin_axis_m: p.spin_axis_m,
      Extension: p.Extension ?? a.Extension, RelHeight: p.RelHeight ?? a.RelHeight,
      rel_side_arm: p.rel_side_arm ?? a.rel_side_arm,
      isFastball: i === iFb,
      fbTipo: fb.tipo as PitchInput["fbTipo"],
      fb_relspeed: fb.RelSpeed, fb_ivb: fb.ivb, fb_hb: fb.hb_arm, fb_axis: fb.spin_axis_m,
    };
    const res = simulate(model, meta, input, "No Altitude", sedes);
    return {
      tipo: p.tipo, uso: 100 * w[i], esRecta: i === iFb,
      stuff: Object.fromEntries(res.map((r) => [r.sede, r.stuffPlus])) as Record<SedeKey, number>,
      movimiento: Object.fromEntries(res.map((r) => [r.sede, r.breakTotal])) as Record<SedeKey, number>,
    };
  });

  // 3. calificacion del arsenal: promedio ponderado por uso
  const stuff = Object.fromEntries(sedes.map((s) => [s, pitches.reduce((acc, p, i) => acc + w[i] * p.stuff[s], 0)])) as Record<SedeKey, number>;
  const ref = meta.arsenal_ref?.scores ?? {};
  const percentil = Object.fromEntries(sedes.map((s) => [s, ref[s] ? percentilEn(ref[s], stuff[s]) : NaN])) as Record<SedeKey, number>;
  return { recta: a.pitches[iFb].tipo, pitches, stuff, percentil };
}

/** Fila de public/data/arsenal.json con los campos necesarios para armar un arsenal. */
export interface ArsenalRow {
  pitcher_anon_id: string; tipo: PitchType; uso: number; measuredAt: SedeKey | null;
  sim_RelSpeed: number | null; sim_ivb: number; sim_hb_arm: number; sim_SpinRate: number; sim_spin_axis_m: number;
  sim_Extension: number; sim_RelHeight: number; sim_rel_side_arm: number;
}

/**
 * Arsenal de un pitcher de la liga a partir de sus filas de arsenal.json (las que tienen sim_RelSpeed).
 * Liberacion del pitcher = promedio ponderado por uso; cada lanzamiento conserva la sede donde se midio.
 * La usan la vista de candidatos ("cargar un pitcher de la LMB") y scripts/build-arsenal-ref.ts, asi la
 * referencia de la liga y la vista calculan exactamente lo mismo.
 */
export function arsenalDeLaLiga(mano: string, rows: ArsenalRow[]): ArsenalInput {
  const rs = rows.filter((r) => r.sim_RelSpeed != null && r.measuredAt);
  const pitches: ArsenalPitch[] = rs.map((r) => ({
    tipo: r.tipo, uso: Math.round(1000 * r.uso) / 10, RelSpeed: r.sim_RelSpeed!, ivb: r.sim_ivb, hb_arm: r.sim_hb_arm,
    SpinRate: r.sim_SpinRate, spin_axis_m: r.sim_spin_axis_m, measuredAt: r.measuredAt!,
  }));
  const tot = rs.reduce((s, r) => s + r.uso, 0);
  const prom = (k: "sim_Extension" | "sim_RelHeight" | "sim_rel_side_arm") => rs.reduce((s, r) => s + r.uso * r[k], 0) / tot;
  return { mano: mano === "Left" ? "Left" : "Right", measuredAt: "No Altitude",
    Extension: prom("sim_Extension"), RelHeight: prom("sim_RelHeight"), rel_side_arm: prom("sim_rel_side_arm"), pitches };
}

// ---------------------------------------------------------------------------
// Link para compartir: el arsenal viaja en la URL, sin nombres ni servidor.
// ---------------------------------------------------------------------------
const TIPO_CODE: Record<PitchType, string> = { "Four-Seam": "FF", Sinker: "SI", Slider: "SL", Changeup: "CH", Curveball: "CU", Cutter: "FC" };
const CODE_TIPO = Object.fromEntries(Object.entries(TIPO_CODE).map(([k, v]) => [v, k])) as Record<string, PitchType>;
const SEDE_CODE: Record<SedeKey, string> = { "No Altitude": "0", "Medium Altitude": "1", "Extreme Altitude": "2", "Harp Helu": "H" };
const CODE_SEDE = Object.fromEntries(Object.entries(SEDE_CODE).map(([k, v]) => [v, k])) as Record<string, SedeKey>;
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

/**
 * Codifica el arsenal en un texto corto para un parametro de URL (?a=...). Velocidad, movimiento y liberacion
 * con dos decimales; uso con uno; giro y eje enteros. Reabrir el link cambia la calificacion menos de medio punto
 * (lo verifica scripts/check-fixtures.ts con todos los pitchers de la liga).
 */
export function encodeArsenal(a: ArsenalInput): string {
  const head = [a.mano === "Left" ? "L" : "R", SEDE_CODE[a.measuredAt], r2(a.Extension), r2(a.RelHeight), r2(a.rel_side_arm)].join(",");
  const body = a.pitches.map((p) => {
    const f = [TIPO_CODE[p.tipo], r1(p.uso), r2(p.RelSpeed), r2(p.ivb), r2(p.hb_arm), Math.round(p.SpinRate), Math.round(p.spin_axis_m)];
    if (p.measuredAt && p.measuredAt !== a.measuredAt) f.push(SEDE_CODE[p.measuredAt] as unknown as number);
    return f.join(",");
  });
  return encodeURIComponent([head, ...body].join(";"));
}

/** Inverso de encodeArsenal. Devuelve null si el texto no es valido. */
export function decodeArsenal(s: string): ArsenalInput | null {
  try {
    const [head, ...rows] = decodeURIComponent(s).split(";");
    const [m, sede, ext, h, side] = head.split(",");
    const pitches = rows.map((row) => {
      const [t, uso, v, ivb, hb, spin, axis, sedeP] = row.split(",");
      if (!CODE_TIPO[t]) throw new Error("tipo");
      const p: ArsenalPitch = { tipo: CODE_TIPO[t], uso: +uso, RelSpeed: +v, ivb: +ivb, hb_arm: +hb, SpinRate: +spin, spin_axis_m: +axis };
      if (sedeP && CODE_SEDE[sedeP]) p.measuredAt = CODE_SEDE[sedeP];
      return p;
    });
    const out: ArsenalInput = { mano: m === "L" ? "Left" : "Right", measuredAt: CODE_SEDE[sede] ?? "No Altitude",
      Extension: +ext, RelHeight: +h, rel_side_arm: +side, pitches };
    const nums = [out.Extension, out.RelHeight, out.rel_side_arm, ...pitches.flatMap((p) => [p.uso, p.RelSpeed, p.ivb, p.hb_arm, p.SpinRate, p.spin_axis_m])];
    return pitches.length && nums.every(Number.isFinite) ? out : null;
  } catch {
    return null;
  }
}
