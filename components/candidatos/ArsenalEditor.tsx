"use client";

import { Panel } from "@/components/consola/Panel";
import { IcoMas } from "@/components/consola/Iconos";
import { SEDE_SEG } from "@/components/consola/textos";
import { PITCH_TYPES, type DashboardMeta } from "@/lib/data";
import { MANO_LABEL, TIPO_LABEL, fmt1 } from "@/lib/format";
import type { PitchType, SedeKey } from "@/lib/simulator";
import { DECIMALES as D, MAX_PITCHES, MIN_PITCHES, nuevoPitch, pitchTipico, redondear, type Draft, type DraftPitch } from "./draft";

const MEASURED_AT: SedeKey[] = ["No Altitude", "Medium Altitude", "Extreme Altitude", "Harp Helu"];

/** Caja numérica compacta con la misma precisión que guarda el link. */
function Num({ label, value, digits, onChange, className = "" }: {
  label: string; value: number; digits: number; onChange: (v: number) => void; className?: string;
}) {
  return (
    <input
      type="number"
      aria-label={label}
      step={10 ** -digits}
      value={redondear(value, digits)}
      onChange={(e) => {
        const v = e.target.valueAsNumber;
        if (Number.isFinite(v)) onChange(redondear(v, digits));
      }}
      className={`ctl num px-1.5 py-1 ${className}`}
    />
  );
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid min-w-0 gap-1 text-xs text-grafito">{label}{children}</label>;
}

interface Props {
  draft: Draft;
  meta: DashboardMeta;
  usoTipico: Record<PitchType, number>;
  onChange: (d: Draft) => void;
}

/** Captura del pitcher (una vez) y tabla editable de su arsenal. */
export function ArsenalEditor({ draft, meta, usoTipico, onChange }: Props) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });
  const setPitch = (id: number, patch: Partial<DraftPitch>) =>
    onChange({ ...draft, pitches: draft.pitches.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  // Al cambiar el tipo se cargan sus valores típicos; la sede propia de la fila deja de aplicar.
  const changeTipo = (p: DraftPitch, tipo: PitchType) => setPitch(p.id, { ...pitchTipico(meta, tipo, p.uso), measuredAt: undefined });
  const add = () => {
    const usados = new Set(draft.pitches.map((p) => p.tipo));
    const tipo = PITCH_TYPES.find((t) => !usados.has(t)) ?? "Four-Seam";
    onChange({ ...draft, pitches: [...draft.pitches, nuevoPitch(meta, tipo, Math.round(usoTipico[tipo]))] });
  };
  const remove = (id: number) => onChange({ ...draft, pitches: draft.pitches.filter((p) => p.id !== id) });
  const suma = draft.pitches.reduce((s, p) => s + Math.max(0, p.uso || 0), 0);

  return (
    <Panel
      ancho={5}
      titulo="Candidato"
      meta="Trackman de cualquier liga; lo horizontal, hacia el lado del brazo"
      pie={<>Suma de uso: <b className="num text-tinta">{fmt1(suma)}%</b>. Al calificar, el uso se normaliza para que sume 100.</>}
    >
      <div className="pb grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Dato label="Mano">
          <select className="ctl" value={draft.mano} onChange={(e) => set("mano", e.target.value as Draft["mano"])}>
            {(["Right", "Left"] as const).map((m) => <option key={m} value={m}>{MANO_LABEL[m]}</option>)}
          </select>
        </Dato>
        <Dato label="Medido en">
          <select className="ctl" value={draft.measuredAt} onChange={(e) => set("measuredAt", e.target.value as SedeKey)}>
            {MEASURED_AT.map((k) => <option key={k} value={k}>{SEDE_SEG[k]}</option>)}
          </select>
        </Dato>
        <Dato label="Extensión (ft)"><Num label="Extensión (ft)" value={draft.Extension} digits={D.liberacion} onChange={(v) => set("Extension", v)} /></Dato>
        <Dato label="Altura de liberación (ft)"><Num label="Altura de liberación (ft)" value={draft.RelHeight} digits={D.liberacion} onChange={(v) => set("RelHeight", v)} /></Dato>
        <Dato label="Lado de liberación (ft)"><Num label="Lado de liberación (ft)" value={draft.rel_side_arm} digits={D.liberacion} onChange={(v) => set("rel_side_arm", v)} /></Dato>
      </div>

      <div className="overflow-x-auto border-t border-linea" data-scroll-x>
        <table className="tabla min-w-[440px] table-fixed">
          <colgroup>
            <col className="w-[34%]" />
            <col span={6} />
            <col className="w-7" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Lanzamiento</th>
              <th scope="col" className="n !px-1.5">Uso</th>
              <th scope="col" className="n !px-1.5">mph</th>
              <th scope="col" className="n !px-1.5">IVB</th>
              <th scope="col" className="n !px-1.5">HB</th>
              <th scope="col" className="n !px-1.5">rpm</th>
              <th scope="col" className="n !px-1.5">Eje</th>
              <th scope="col"><span className="sr-only">Quitar</span></th>
            </tr>
          </thead>
          <tbody>
            {draft.pitches.map((p, i) => (
              <tr key={p.id}>
                <td className="!px-1.5">
                  <select
                    className="ctl px-1.5 py-1 text-[13px]" aria-label={`Tipo del lanzamiento ${i + 1}`}
                    value={p.tipo} onChange={(e) => changeTipo(p, e.target.value as PitchType)}
                  >
                    {PITCH_TYPES.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                  </select>
                  {p.measuredAt && p.measuredAt !== draft.measuredAt && (
                    <span className="chip mt-1 inline-block">Medido en: {SEDE_SEG[p.measuredAt]}</span>
                  )}
                </td>
                <td className="!px-0.5"><Num label={`Uso del lanzamiento ${i + 1}`} value={p.uso} digits={D.uso} onChange={(v) => setPitch(p.id, { uso: v })} /></td>
                <td className="!px-0.5"><Num label={`Velocidad del lanzamiento ${i + 1}`} value={p.RelSpeed} digits={D.velocidad} onChange={(v) => setPitch(p.id, { RelSpeed: v })} /></td>
                <td className="!px-0.5"><Num label={`IVB del lanzamiento ${i + 1}`} value={p.ivb} digits={D.movimiento} onChange={(v) => setPitch(p.id, { ivb: v })} /></td>
                <td className="!px-0.5"><Num label={`HB del lanzamiento ${i + 1}`} value={p.hb_arm} digits={D.movimiento} onChange={(v) => setPitch(p.id, { hb_arm: v })} /></td>
                <td className="!px-0.5"><Num label={`Giro del lanzamiento ${i + 1}`} value={p.SpinRate} digits={D.giro} onChange={(v) => setPitch(p.id, { SpinRate: v })} /></td>
                <td className="!px-0.5"><Num label={`Eje del lanzamiento ${i + 1}`} value={p.spin_axis_m} digits={D.eje} onChange={(v) => setPitch(p.id, { spin_axis_m: v })} /></td>
                <td className="!px-1 text-right">
                  {draft.pitches.length > MIN_PITCHES && (
                    <button type="button" onClick={() => remove(p.id)} className="text-lg leading-none text-grafito hover:text-tinta" aria-label={`Quitar el lanzamiento ${i + 1}`}>×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-[18px] pb-3 pt-1">
        <button type="button" className="btn" onClick={add} disabled={draft.pitches.length >= MAX_PITCHES}>
          <IcoMas />{draft.pitches.length >= MAX_PITCHES ? `Máximo ${MAX_PITCHES} lanzamientos` : "Agregar lanzamiento"}
        </button>
      </div>
    </Panel>
  );
}
