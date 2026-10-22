/**
 * Verifica que el simulador web reproduce los casos de referencia calculados en Python.
 * Uso: npm run check
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { simulate, type Meta, type PitchInput, type SedeKey } from "../lib/simulator";
import type { StuffModel } from "../lib/stuffModel";
import { arsenalDeLaLiga, evaluateArsenal, encodeArsenal, decodeArsenal, type ArsenalInput, type ArsenalRow } from "../lib/arsenal";

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

// Evaluador de arsenal contra la implementacion de referencia en Python
const arsenalCases = read<{ input: ArsenalInput; expected: { recta: string; stuff: Record<string, number>; pitches: { tipo: string; stuff: Record<string, number> }[] } }[]>(
  "tests/arsenal_fixtures.json",
);
let fallas = 0;
for (const c of arsenalCases) {
  const r = evaluateArsenal(model, meta, c.input);
  if (r.recta !== c.expected.recta) { console.error(`FALLA: recta ${r.recta} vs ${c.expected.recta}`); fallas++; }
  for (const [sede, v] of Object.entries(c.expected.stuff)) {
    const diff = Math.abs(r.stuff[sede as keyof typeof r.stuff] - v);
    worst = Math.max(worst, diff);
    console.log(`arsenal ${c.input.pitches.map((p) => p.tipo).join("+").padEnd(36)} ${sede.padEnd(16)} ${r.stuff[sede as keyof typeof r.stuff].toFixed(2)}  (ref ${v.toFixed(2)})`);
  }
  r.pitches.forEach((p, i) => {
    for (const [sede, v] of Object.entries(c.expected.pitches[i].stuff))
      worst = Math.max(worst, Math.abs(p.stuff[sede as keyof typeof p.stuff] - v));
  });
  // el link para compartir debe reconstruir el mismo arsenal (con un decimal)
  const back = decodeArsenal(encodeArsenal(c.input));
  if (!back || back.pitches.length !== c.input.pitches.length) { console.error("FALLA: link de arsenal"); fallas++; }
}
// la referencia de la liga debe coincidir con lo que calcula la vista al cargar un pitcher de la LMB
const ref = read<{ porPitcher: Record<string, Record<string, number>> }>("public/data/arsenal_ref.json");
const filas = read<ArsenalRow[]>("public/data/arsenal.json");
const manos = new Map(read<{ pitcher_anon_id: string; mano: string }[]>("public/data/pitchers.json").map((p) => [p.pitcher_anon_id, p.mano]));
for (const id of Object.keys(ref.porPitcher).slice(0, 10)) {
  const a = arsenalDeLaLiga(manos.get(id) ?? "Right", filas.filter((r) => r.pitcher_anon_id === id));
  const r = evaluateArsenal(model, meta, a);
  for (const [sede, v] of Object.entries(ref.porPitcher[id])) worst = Math.max(worst, Math.abs(r.stuff[sede as keyof typeof r.stuff] - v));
  const back = decodeArsenal(encodeArsenal(a));
  if (!back || back.pitches.some((p, i) => (p.measuredAt ?? back.measuredAt) !== (a.pitches[i].measuredAt ?? a.measuredAt))) {
    console.error(`FALLA: el link pierde la sede de medición (${id})`); fallas++;
  }
}

if (decodeArsenal("basura;;") !== null) { console.error("FALLA: un link inválido debe devolver null"); fallas++; }

if (worst > TOL || fallas) {
  console.error(`FALLA: diferencia máxima ${worst.toFixed(4)} (tolerancia ${TOL}), ${fallas} fallas`);
  process.exit(1);
}
console.log(`OK: ${cases.length} lanzamientos y ${arsenalCases.length} arsenales, diferencia máxima ${worst.toExponential(2)}`);
