// Tipos y carga de los JSON que genera el pipeline (public/data/).
// Los cuatro archivos se piden una sola vez por visita y se comparten entre vistas.
import type { Meta, PitchType, SedeKey } from "./simulator";
import type { StuffModel } from "./stuffModel";

export const PITCH_TYPES: PitchType[] = ["Four-Seam", "Sinker", "Slider", "Changeup", "Curveball", "Cutter"];
export const FASTBALL_TYPES = ["Four-Seam", "Sinker", "Cutter"] as const;
export type FastballType = (typeof FASTBALL_TYPES)[number];

type PitchFeatures = {
  RelSpeed: number; ivb: number; hb_arm: number; SpinRate: number; spin_axis_m: number;
  Extension: number; RelHeight: number; rel_side_arm: number;
};
type ProfileStat = { top: number; avg: number };

/** meta.json completo: lo que usa el simulador más los resultados que muestran las demás vistas. */
export interface DashboardMeta extends Meta {
  features: string[];
  physics: Meta["physics"] & {
    p_drag_global: number;
    ic95_tipo: Record<string, [number, number]>;
    valida_medium: Record<string, boolean>;
  };
  defaults: Record<PitchType, PitchFeatures> & {
    _fastball: { fb_relspeed: number; fb_ivb: number; fb_hb: number; fb_axis: number };
  };
  ranges: Record<keyof PitchFeatures, [number, number]>;
  validation: {
    ladder: { modelo: string; mejora_mse_pct: number; corr_pitcher_tipo: number | null }[];
    oof_corr: number;
    oof_n: number;
    temporal_corr: number;
    temporal_new_corr: number;
    year_to_year: { par: string; n: number; estab_stuff: number; estab_rv: number; pred_stuff: number; pred_rv: number }[];
    small_sample: { N: number; n: number; stuff: number; rv: number }[];
    importance: Record<string, number>;
  };
  delta_tipo_proyectado: { tipo: PitchType; stuff_mar: number; stuff_cdmx: number; delta: number; n: number }[];
  delta_tipo_observado: { tipo: PitchType; mean: number; size: number }[];
  perfil: Record<PitchType, Record<"mar" | "extrema", Record<string, ProfileStat>>>;
  perdida_mov_tipo: {
    observado: Record<PitchType, number>;
    lineal_densidad: number;
    observado_promedio: number;
    modelo_fisico_explica_pct: number;
    densidad_sola_explica_pct: number;
  };
  dataset: { lanzamientos: number; pitchers: number; juegos: number; temporadas: number[] };
}

export interface Pitcher {
  pitcher_anon_id: string;
  mano: "Right" | "Left";
  n: number;
  stuff: number;
  rv100: number;
  stuff_mar: number | null; n_mar: number | null;
  stuff_media: number | null; n_media: number | null;
  stuff_extrema: number | null; n_extrema: number | null;
  stuff_cdmx_proy: number | null; n_proy: number | null;
  delta_cdmx_proy: number | null;
}

/** Un lanzamiento del arsenal de un pitcher; los campos sim_* son la entrada del simulador. */
export interface ArsenalPitch {
  pitcher_anon_id: string;
  tipo: PitchType;
  n: number;
  stuff: number;
  velo: number; ivb: number; hb: number; spin: number;
  delta_cdmx: number | null;
  uso: number;
  sim_RelSpeed: number; sim_ivb: number; sim_hb_arm: number; sim_SpinRate: number;
  sim_spin_axis_m: number; sim_Extension: number; sim_RelHeight: number; sim_rel_side_arm: number;
  measuredAt: SedeKey;
  fbTipo: FastballType;
  fb_relspeed: number; fb_ivb: number; fb_hb: number; fb_axis: number;
  isFastball: boolean;
}

export interface DashboardData {
  meta: DashboardMeta;
  model: StuffModel;
  pitchers: Pitcher[];
  arsenal: ArsenalPitch[];
}

let pending: Promise<DashboardData> | null = null;

async function getJson<T>(name: string): Promise<T> {
  const res = await fetch(`/data/${name}`);
  if (!res.ok) throw new Error(`No se pudo cargar ${name} (${res.status})`);
  return (await res.json()) as T;
}

/** Descarga los datos una vez; las llamadas siguientes reutilizan la misma promesa. */
export function loadDashboardData(): Promise<DashboardData> {
  if (!pending) {
    pending = Promise.all([
      getJson<DashboardMeta>("meta.json"),
      getJson<StuffModel>("model.json"),
      getJson<Pitcher[]>("pitchers.json"),
      getJson<ArsenalPitch[]>("arsenal.json"),
    ]).then(([meta, model, pitchers, arsenal]) => ({ meta, model, pitchers, arsenal }));
    // Si la descarga falla, se permite reintentar en la siguiente visita a una vista.
    pending.catch(() => { pending = null; });
  }
  return pending;
}
