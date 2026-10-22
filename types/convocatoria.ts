// Tipos de los resultados que responden a requisitos de la convocatoria (pipeline/11 a 13):
// robustez del modelo, riesgo de contacto e hipótesis H3, y el mapa de movimiento.
import type { DashboardMeta } from "@/lib/data";
import type { PitchType } from "@/lib/simulator";

export type Intervalo = [number, number];

/** Prueba con pitchers no vistos, contra predecir el promedio por conteo (baseline nulo). */
export interface Holdout {
  n_lanzamientos: number;
  mejora_mse_vs_nulo_pct: number;
  corr_modelo: number;
  n_pt: number;
}

/** Park holdout estricto: el modelo no ve la categoría de altitud evaluada ni a sus pitchers. */
export interface ParkEstricto {
  n_pt: number;
  corr_sin_ver_sede: number;
  corr_viendo_sede: number;
  mejora_mse_vs_nulo_pct: number;
}

export interface Robustez {
  pitcher_holdout: Holdout;
  park_holdout: Record<string, Holdout>;
  park_holdout_estricto: Record<string, ParkEstricto>;
  /** promedio del valor absoluto de la contribución SHAP, en puntos de Stuff+ */
  shap: { global: Record<string, number> };
}

/** Contacto de un grupo de lanzamientos, sin altitud contra altitud extrema, con los mismos pitchers. */
export interface ContactoFila {
  bip_mar: number;
  bip_extrema: number;
  /** jonrones por cada 100 bolas en juego */
  hr100_mar: number;
  hr100_extrema: number;
  /** cambio relativo de jonrones por bola en juego, en % */
  hr_riesgo_pct: number;
  hr_ic95: Intervalo;
  /** cambio de contacto duro, en puntos porcentuales */
  duro_dif_pp: number;
  duro_ic95_pp: Intervalo;
}

export interface Contacto {
  pitchers: number;
  por_tipo: (ContactoFila & { tipo: PitchType })[];
  total: (ContactoFila & { t: string })[];
  recta_por_ride: (ContactoFila & { perfil: string })[];
  /** cortes de IVB (in, a nivel del mar) entre ride bajo, medio y alto */
  ride_cortes_in: [number, number];
  h3: {
    /** cuánto más cuesta un elevado que un rodado, en carreras */
    elevado_menos_rodado: { mar: number; extrema: number };
    corr_rodados_vs_carreras: Record<"mar" | "extrema", { n: number; corr: number; ic95: Intervalo }>;
  };
}

export type MetaConvocatoria = DashboardMeta & { robustez: Robustez; contacto: Contacto };
export const conConvocatoria = (meta: DashboardMeta) => meta as MetaConvocatoria;

/** Una forma de la liga: pitcher × lanzamiento a nivel del mar y trasladada al Harp Helú (pipeline/12). */
export interface Forma {
  tipo: PitchType;
  n: number;
  velo: number;
  ivb: number; hb: number; s_mar: number; s_mar_pct: number;
  ivb_hh: number; hb_hh: number; s_hh: number; s_hh_pct: number;
}

export interface MovementMap { nota: string; formas: Forma[] }
