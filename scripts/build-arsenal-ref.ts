/**
 * Distribucion de referencia del evaluador de arsenal.
 * Evalua el arsenal promedio de cada pitcher de la tabla (>=300 lanzamientos) con el MISMO
 * metodo que usa la vista de candidatos, para que "por encima del X% de la liga" compare
 * igual contra igual. Escribe public/data/arsenal_ref.json.
 * Uso: npx tsx scripts/build-arsenal-ref.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { arsenalDeLaLiga, evaluateArsenal, SEDES_ARSENAL, type ArsenalRow } from "../lib/arsenal";
import type { StuffModel } from "../lib/stuffModel";
import type { Meta } from "../lib/simulator";

const root = join(__dirname, "..");
const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));
const model: StuffModel = read("public/data/model.json");
const meta: Meta = read("public/data/meta.json");
const pitchers: { pitcher_anon_id: string; mano: string }[] = read("public/data/pitchers.json");
const rows: ArsenalRow[] = read("public/data/arsenal.json");

const byP = new Map<string, ArsenalRow[]>();
for (const r of rows) if (r.sim_RelSpeed != null) (byP.get(r.pitcher_anon_id) ?? byP.set(r.pitcher_anon_id, []).get(r.pitcher_anon_id)!).push(r);

const porPitcher: Record<string, Record<string, number>> = {};
for (const p of pitchers) {
  const rs = byP.get(p.pitcher_anon_id);
  if (!rs?.length) continue;
  const a = arsenalDeLaLiga(p.mano, rs);
  const res = evaluateArsenal(model, meta, a);
  porPitcher[p.pitcher_anon_id] = Object.fromEntries(SEDES_ARSENAL.map((s) => [s, Math.round(res.stuff[s] * 100) / 100]));
}
const ids = Object.keys(porPitcher);
const scores = Object.fromEntries(SEDES_ARSENAL.map((s) => [s, ids.map((i) => porPitcher[i][s]).sort((x, y) => x - y)]));
writeFileSync(join(root, "public/data/arsenal_ref.json"), JSON.stringify({ n: ids.length, scores, porPitcher }));
console.log(`arsenal_ref.json: ${ids.length} pitchers evaluados`);
