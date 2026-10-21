/**
 * Verifica que el simulador web reproduce los casos de referencia calculados en Python.
 * Uso: npm run check
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { simulate, type Meta, type PitchInput, type SedeKey } from "../lib/simulator";
import type { StuffModel } from "../lib/stuffModel";

const root = join(__dirname, "..");
const read = <T,>(p: string): T => JSON.parse(readFileSync(join(root, p), "utf8")) as T;

const model = read<StuffModel>("public/data/model.json");
const meta = read<Meta>("public/data/meta.json");
const cases = read<{ input: PitchInput; measuredAt: SedeKey; expectedStuffPlus: Record<string, number> }[]>(
  "tests/fixtures.json",
);

const TOL = 0.01;
let worst = 0;
for (const c of cases) {
  for (const r of simulate(model, meta, c.input, c.measuredAt)) {
    const diff = Math.abs(r.stuffPlus - c.expectedStuffPlus[r.sede]);
    worst = Math.max(worst, diff);
    console.log(`${c.input.tipo.padEnd(10)} ${r.sede.padEnd(16)} ${r.stuffPlus.toFixed(2)}  (ref ${c.expectedStuffPlus[r.sede].toFixed(2)})`);
  }
}
if (worst > TOL) {
  console.error(`FALLA: diferencia máxima ${worst.toFixed(4)} > ${TOL}`);
  process.exit(1);
}
console.log(`OK: ${cases.length} casos, diferencia máxima ${worst.toExponential(2)}`);
