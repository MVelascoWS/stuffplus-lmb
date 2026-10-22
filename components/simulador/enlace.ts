// Link para compartir un lanzamiento del simulador: todo lo capturado viaja en ?s=, sin servidor.
import type { PitchInput, PitchType, SedeKey } from "@/lib/simulator";

const TIPO: Record<PitchType, string> = { "Four-Seam": "FF", Sinker: "SI", Slider: "SL", Changeup: "CH", Curveball: "CU", Cutter: "FC" };
const SEDE: Record<SedeKey, string> = { "No Altitude": "0", "Medium Altitude": "1", "Extreme Altitude": "2", "Harp Helu": "H" };
const invertir = <K extends string>(m: Record<K, string>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<string, K>;
const TIPO_INV = invertir(TIPO), SEDE_INV = invertir(SEDE);
const r2 = (x: number) => Math.round(x * 100) / 100;

const NUMEROS = ["RelSpeed", "ivb", "hb_arm", "SpinRate", "spin_axis_m", "Extension", "RelHeight", "rel_side_arm",
  "fb_relspeed", "fb_ivb", "fb_hb", "fb_axis"] as const;

export function codificar(p: PitchInput, medido: SedeKey): string {
  const campos = [TIPO[p.tipo], SEDE[medido], p.isFastball ? "1" : "0", TIPO[p.fbTipo], ...NUMEROS.map((k) => r2(p[k]))];
  return campos.join(",");
}

/** Inverso de codificar; null si el texto no es válido (el simulador entonces muestra valores típicos). */
export function decodificar(s: string): { input: PitchInput; medido: SedeKey } | null {
  const [t, sede, fb, fbT, ...nums] = s.split(",");
  const tipo = TIPO_INV[t], fbTipo = TIPO_INV[fbT], medido = SEDE_INV[sede];
  const v = nums.map(Number);
  if (!tipo || !medido || !["Four-Seam", "Sinker", "Cutter"].includes(fbTipo) || v.length !== NUMEROS.length || !v.every(Number.isFinite)) {
    return null;
  }
  const input = Object.fromEntries(NUMEROS.map((k, i) => [k, v[i]])) as Record<(typeof NUMEROS)[number], number>;
  return { input: { tipo, isFastball: fb === "1", fbTipo: fbTipo as PitchInput["fbTipo"], ...input }, medido };
}
