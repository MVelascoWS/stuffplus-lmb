// Simulador Stuff+ por sede: traslada un lanzamiento entre altitudes con la ley
// fisica validada y lo califica con el modelo. Sin dependencias.
import { predictRV, toStuffPlus, type StuffModel, type Scale } from "./stuffModel";

export type PitchType = "Four-Seam" | "Sinker" | "Slider" | "Changeup" | "Curveball" | "Cutter";
export type SedeKey = "No Altitude" | "Medium Altitude" | "Extreme Altitude" | "Harp Helu";

export type SmoothField = "RelSpeed" | "ivb" | "hb_arm" | "SpinRate" | "spin_axis_m" | "Extension" | "RelHeight"
  | "rel_side_arm" | "fb_relspeed" | "fb_ivb" | "fb_hb" | "fb_axis";

export interface Sede { alt: number; h: number; label: string; rho: number; rho_ratio: number }
export interface Meta {
  scale: Record<string, Scale>;
  sedes: Record<SedeKey, Sede>;
  physics: { p_magnus_global: number; p_magnus_tipo: Record<string, number> };
  percentiles_por_alt: Record<string, number[]>;
  /**
   * Variacion de ejecucion: la prediccion se promedia sobre estos desplazamientos (en desviaciones estandar),
   * una columna por campo de `fields`. sigma = mitad de la variacion natural lanzamiento a lanzamiento.
   */
  smoothing: { fields: SmoothField[]; sigma: Record<SmoothField, number>; offsets: number[][] };
  /** Equivalencias de Stuff+ en el campo (ver pipeline/08_calibration.py) */
  calibration?: { por_10_puntos: { carreras_100: number; whiff_pct: number; csw_pct: number; contacto_fuerte_pct: number } };
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
    const ivb = ivb0 * f, hb = hb0 * f;
    const { sigma: sg, offsets, fields } = meta.smoothing;
    const c = Object.fromEntries(fields.map((campo, i) => [campo, i])) as Record<SmoothField, number>;
    // la recta: si el lanzamiento ES la recta, su referencia es el propio lanzamiento (sin variar)
    const fb0 = p.isFastball ? [p.RelSpeed, ivb0, hb0, p.spin_axis_m] : [fbVelo, fbIvb0, fbHb0, fbAxis];
    let rv = 0;
    for (const o of offsets) {
      const v = p.RelSpeed + o[c.RelSpeed] * sg.RelSpeed;
      const iv = (ivb0 + o[c.ivb] * sg.ivb) * f, hh = (hb0 + o[c.hb_arm] * sg.hb_arm) * f;
      const ax = p.spin_axis_m + o[c.spin_axis_m] * sg.spin_axis_m;
      const fv = fb0[0] + o[c.fb_relspeed] * sg.fb_relspeed;
      const fi = (fb0[1] + o[c.fb_ivb] * sg.fb_ivb) * ff, fh = (fb0[2] + o[c.fb_hb] * sg.fb_hb) * ff;
      const fa = fb0[3] + o[c.fb_axis] * sg.fb_axis;
      rv += predictRV(model, {
        RelSpeed: v, ivb: iv, hb_arm: hh,
        SpinRate: p.SpinRate + o[c.SpinRate] * sg.SpinRate, spin_axis_m: ax,
        Extension: p.Extension + o[c.Extension] * sg.Extension,
        RelHeight: p.RelHeight + o[c.RelHeight] * sg.RelHeight,
        rel_side_arm: p.rel_side_arm + o[c.rel_side_arm] * sg.rel_side_arm,
        fb_relspeed: fv, fb_ivb: fi, d_velo: v - fv, d_ivb: iv - fi, d_hb: hh - fh,
        d_axis: wrap(ax - fa), alt: s.alt,
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

// ---------------------------------------------------------------------------
// Palancas: que cambio sube mas el Stuff+ de un tipo de lanzamiento en una sede.
// Son efectos promedio sobre miles de lanzamientos reales de ese tipo (ver
// pipeline/09_levers.py), no un calculo sobre un solo punto: un modelo de arboles
// tiene ondulaciones locales y el promedio es lo estable.
// ---------------------------------------------------------------------------

export type LeverField = "RelSpeed" | "ivb" | "hb_arm" | "SpinRate" | "spin_axis_m" | "Extension";

export interface Lever {
  campo: LeverField;
  label: string;
  /** cambio recomendado, con el signo que mas ayuda */
  cambio: number;
  unidad: string;
  /** Δ Stuff+ promedio con ese cambio */
  ganancia: number;
  /** false si ningun sentido mejora el Stuff+ de forma apreciable (< 0.2 puntos) */
  ayuda: boolean;
  /** el cambio en lenguaje llano, p. ej. "1 in más hacia el lado del guante" */
  accion: string;
}

export interface LeverTable {
  pasos: Record<LeverField, number>;
  /** efecto[alt][tipo][campo] = { mas, menos, mas_se, menos_se } */
  efecto: Record<string, Record<string, Record<LeverField, { mas: number; menos: number }>>>;
}

const ACCION: Record<LeverField, (c: number) => string> = {
  RelSpeed: (c) => `${Math.abs(c)} mph ${c > 0 ? "más rápido" : "más lento"}`,
  ivb: (c) => `${Math.abs(c)} in ${c > 0 ? "más de elevación (ride)" : "más de caída"}`,
  hb_arm: (c) => `${Math.abs(c)} in más hacia el lado ${c > 0 ? "del brazo" : "del guante"}`,
  SpinRate: (c) => `${Math.abs(c)} rpm ${c > 0 ? "más" : "menos"} de giro`,
  spin_axis_m: (c) => `eje de giro ${c > 0 ? "+" : "−"}${Math.abs(c)}°`,
  Extension: (c) => `${Math.abs(c)} ft ${c > 0 ? "más" : "menos"} de extensión`,
};

const LEVER_LABELS: Record<LeverField, [string, string]> = {
  RelSpeed: ["Velocidad", "mph"],
  ivb: ["Movimiento vertical (IVB)", "in"],
  hb_arm: ["Movimiento horizontal (HB, hacia el brazo)", "in"],
  SpinRate: ["Giro", "rpm"],
  spin_axis_m: ["Eje de giro", "°"],
  Extension: ["Extensión", "ft"],
};

export function levers(meta: Meta & { levers: LeverTable }, tipo: PitchType, sede: SedeKey = "Harp Helu"): Lever[] {
  const alt = String(meta.sedes[sede].alt);
  const tabla = meta.levers.efecto[alt][tipo];
  return (Object.keys(LEVER_LABELS) as LeverField[])
    .map((campo) => {
      const e = tabla[campo], paso = meta.levers.pasos[campo];
      const mas = e.mas >= e.menos;
      const ganancia = mas ? e.mas : e.menos;
      const extensionHaciaAtras = campo === "Extension" && !mas;   // perder extension no es una recomendacion
      return {
        campo, label: LEVER_LABELS[campo][0], unidad: LEVER_LABELS[campo][1],
        cambio: mas ? paso : -paso, ganancia, ayuda: ganancia >= 0.2 && !extensionHaciaAtras,
        accion: ACCION[campo](mas ? paso : -paso),
      };
    })
    .sort((a, b) => Number(b.ayuda) - Number(a.ayuda) || b.ganancia - a.ganancia);
}

/** Traduce una diferencia de Stuff+ a unidades de campo (por cada 1,000 lanzamientos). */
export function tangibles(meta: Meta, deltaStuff: number) {
  const c = meta.calibration?.por_10_puntos;
  if (!c) return null;
  const k = deltaStuff / 10;
  return {
    carrerasPor1000: 10 * c.carreras_100 * k,   // negativo = menos carreras permitidas
    whiffPp: c.whiff_pct * k,
    cswPp: c.csw_pct * k,
    contactoFuertePp: c.contacto_fuerte_pct * k,
  };
}
