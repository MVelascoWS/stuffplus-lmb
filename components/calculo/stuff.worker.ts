// Calcula Stuff+ fuera del hilo principal para que los controles respondan mientras el modelo trabaja.
// Usa exactamente las mismas funciones que el resto del sitio (lib/simulator.ts y lib/arsenal.ts).
import { evaluateArsenal, type ArsenalInput, type ArsenalRef } from "@/lib/arsenal";
import { simulate, type Meta, type PitchInput, type SedeKey } from "@/lib/simulator";
import type { StuffModel } from "@/lib/stuffModel";

export type Mensaje =
  | { kind: "init"; model: StuffModel; meta: Meta }
  | { kind: "ref"; ref: ArsenalRef }
  | { kind: "simulate"; id: number; input: PitchInput; measuredAt: SedeKey }
  | { kind: "arsenal"; id: number; inputs: ArsenalInput[] };

let model: StuffModel | null = null;
let meta: Meta | null = null;
let ref: ArsenalRef | undefined;

self.onmessage = (e: MessageEvent<Mensaje>) => {
  const m = e.data;
  if (m.kind === "init") { model = m.model; meta = m.meta; return; }
  if (m.kind === "ref") { ref = m.ref; return; }
  try {
    if (!model || !meta) throw new Error("El cálculo no se inicializó");
    const result = m.kind === "simulate"
      ? simulate(model, meta, m.input, m.measuredAt)
      : m.inputs.map((a) => evaluateArsenal(model!, { ...meta!, arsenal_ref: ref }, a));
    self.postMessage({ id: m.id, result });
  } catch (err) {
    self.postMessage({ id: m.id, error: String(err) });
  }
};
