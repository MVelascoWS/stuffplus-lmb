// Tipos de las secciones de meta.json que agregan los pasos 07–09 del pipeline:
// equivalencias en el campo, palancas por tipo y validación de la proyección a altitud.
import type { DashboardMeta } from "@/lib/data";
import type { LeverTable } from "@/lib/simulator";

/** Lo que pasó en el campo para un nivel de Stuff+ (pipeline/08_calibration.py). */
export interface CalibrationRow {
  nivel: string;
  combinaciones: number;
  lanzamientos: number;
  /** carreras permitidas por cada 100 lanzamientos, frente al promedio de su tipo de sede */
  carreras_100: number;
  whiff_pct: number;
  csw_pct: number;
  contacto_fuerte_pct: number;
}

export interface Calibration {
  tabla: CalibrationRow[];
  /** cambio de cada medida por cada 10 puntos de Stuff+ */
  por_10_puntos: { carreras_100: number; whiff_pct: number; csw_pct: number; contacto_fuerte_pct: number };
  carreras_por_1000_lanz_por_10_puntos: number;
  nota: string;
}

/** Correlación y error medio (en puntos de Stuff+) de una forma de anticipar el Stuff+ en altitud. */
export interface ProjectionScore { corr: number; mae: number }

/** ¿El simulador anticipa el Stuff+ en altitud de pitchers que el modelo no vio? (pipeline/07_validate_projection.py) */
export interface ProjectionValidation {
  n: number;
  n_pitchers: number;
  /** suponer que el pitcher rinde en altitud igual que a nivel del mar */
  ingenuo: ProjectionScore;
  proyeccion: ProjectionScore;
  /** correlación entre el cambio proyectado y el observado */
  cambio_corr: number;
  por_tipo: Record<string, { n: number; ingenuo: ProjectionScore; proyeccion: ProjectionScore }>;
  reduccion_error_pct: number;
  reduccion_error_ic95: [number, number];
  /** correlación con las carreras realmente permitidas en altitud */
  vs_resultado_real: {
    n: number;
    ingenuo: number;
    proyeccion: number;
    /** Stuff+ de los lanzamientos que de hecho tiraron en altitud */
    techo: number;
    mejora_ic95: [number, number];
  };
}

export type MetaConResultados = DashboardMeta & {
  calibration: Calibration;
  levers: LeverTable;
  projection_validation: ProjectionValidation;
};

/** meta.json ya incluye estas secciones; esto solo le da a TypeScript sus tipos. */
export const conResultados = (meta: DashboardMeta) => meta as MetaConResultados;
