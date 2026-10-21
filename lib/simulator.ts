// Simulador Stuff+ por sede: traslada un lanzamiento entre altitudes con la ley
// fisica validada y lo califica con el modelo. Sin dependencias.
import { predictRV, toStuffPlus, type StuffModel, type Scale } from "./stuffModel";

export type PitchType = "Four-Seam" | "Sinker" | "Slider" | "Changeup" | "Curveball" | "Cutter";
export type SedeKey = "No Altitude" | "Medium Altitude" | "Extreme Altitude" | "Harp Helu";

export interface Sede { alt: number; h: number; label: string; rho: number; rho_ratio: number }
export interface Meta {
  scale: Record<string, Scale>;
  sedes: Record<SedeKey, Sede>;
  physics: { p_magnus_global: number; p_magnus_tipo: Record<string, number> };
  percentiles_por_alt: Record<string, number[]>;
  /** Variacion natural de ejecucion: la prediccion se promedia sobre estos desplazamientos */
  smoothing: { sigma: { RelSpeed: number; ivb: number; hb_arm: number }; offsets: [number, number, number][] };
}

/** Lo que el usuario captura. Horizontal siempre "hacia el lado del brazo" (zurdos ya espejeados). */
export interface PitchInput {
  tipo: PitchType;
  RelSpeed: number; ivb: number; hb_arm: number; SpinRate: number; spin_axis_m: number;
  Extension: number; RelHeight: number; rel_side_arm: number;
  /** recta principal del mismo pitcher; si el lanzamiento ES la recta, isFastball = true */
  isFastball: boolean;
  fbTipo: "Four-Seam" | "Sinker" | "Cutter";
  fb_relspeed: number; fb_ivb: number; fb_hb: number; fb_axis: number;
}

export interface SedeResult {
  sede: SedeKey; label: string; stuffPlus: number; percentil: number;
  ivb: number; hb_arm: number; breakTotal: number; perdidaMovPct: number; rv: number;
}

const factor = (meta: Meta, tipo: string, rhoRatio: number) =>
  Math.pow(rhoRatio, meta.physics.p_magnus_tipo[tipo] ?? meta.physics.p_magnus_global);
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

function percentile(table: number[], v: number): number {
  let i = 0;
  while (i < table.length && table[i] < v) i++;
  return Math.max(0, Math.min(100, i - 1 < 0 ? 0 : i - 1));
}

/**
 * Califica el lanzamiento en cada sede.
 * measuredAt: donde se midieron los valores capturados (por defecto, nivel del mar).
 * Primero se lleva a "nivel del mar" dividiendo entre su factor, luego se traslada a cada sede.
 */
export function simulate(
  model: StuffModel, meta: Meta, p: PitchInput, measuredAt: SedeKey = "No Altitude",
  sedes: SedeKey[] = ["No Altitude", "Medium Altitude", "Harp Helu"],
): SedeResult[] {
  const r0 = meta.sedes[measuredAt].rho_ratio;
  const fbT = p.isFastball ? p.tipo : p.fbTipo;
  const ivb0 = p.ivb / factor(meta, p.tipo, r0), hb0 = p.hb_arm / factor(meta, p.tipo, r0);
  const fbIvb0 = (p.isFastball ? p.ivb : p.fb_ivb) / factor(meta, fbT, r0);
  const fbHb0 = (p.isFastball ? p.hb_arm : p.fb_hb) / factor(meta, fbT, r0);
  const fbVelo = p.isFastball ? p.RelSpeed : p.fb_relspeed;
  const fbAxis = p.isFastball ? p.spin_axis_m : p.fb_axis;
  const brk0 = Math.hypot(ivb0, hb0);

  return sedes.map((k) => {
    const s = meta.sedes[k];
    const f = factor(meta, p.tipo, s.rho_ratio), ff = factor(meta, fbT, s.rho_ratio);
    const ivb = ivb0 * f, hb = hb0 * f, fbIvb = fbIvb0 * ff, fbHb = fbHb0 * ff;
    const { sigma, offsets } = meta.smoothing;
    let rv = 0;
    for (const [ov, oi, oh] of offsets) {
      const v = p.RelSpeed + ov * sigma.RelSpeed;
      const iv = (ivb0 + oi * sigma.ivb) * f, hh = (hb0 + oh * sigma.hb_arm) * f;
      rv += predictRV(model, {
        RelSpeed: v, ivb: iv, hb_arm: hh, SpinRate: p.SpinRate, spin_axis_m: p.spin_axis_m,
        Extension: p.Extension, RelHeight: p.RelHeight, rel_side_arm: p.rel_side_arm,
        fb_relspeed: fbVelo, fb_ivb: fbIvb,
        d_velo: v - fbVelo, d_ivb: iv - fbIvb, d_hb: hh - fbHb,
        d_axis: wrap(p.spin_axis_m - fbAxis), alt: s.alt,
      });
    }
    rv /= offsets.length;
    const stuffPlus = toStuffPlus(rv, meta.scale[String(s.alt)]);
    const breakTotal = Math.hypot(ivb, hb);
    return {
      sede: k, label: s.label, stuffPlus, rv,
      percentil: percentile(meta.percentiles_por_alt[String(s.alt)], stuffPlus),
      ivb, hb_arm: hb, breakTotal, perdidaMovPct: 100 * (breakTotal / brk0 - 1),
    };
  });
}
