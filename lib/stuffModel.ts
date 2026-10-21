// Evaluador del modelo Stuff+ (LightGBM aplanado). Sin dependencias.
export type Tree = [number[], number[], number[], number[]];
export interface StuffModel { features: string[]; trees: Tree[] }

export function predictRV(model: StuffModel, x: Record<string, number>): number {
  const v = model.features.map((k) => x[k]);
  let s = 0;
  for (const [f, t, l, r] of model.trees) {
    let i = 0;
    while (f[i] !== -1) i = v[f[i]] <= t[i] ? l[i] : r[i];
    s += t[i];
  }
  return s;
}

export interface Scale { mean: number; std: number }
/** Stuff+ = 100 + 10 * (media - prediccion) / sd  (mas alto = mejor para el pitcher) */
export function toStuffPlus(rv: number, scale: Scale): number {
  return 100 + (10 * (scale.mean - rv)) / scale.std;
}
