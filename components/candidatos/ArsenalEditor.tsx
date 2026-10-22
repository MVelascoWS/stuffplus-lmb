"use client";

import { useId } from "react";
import { Card, CardTitle } from "@/components/ui";
import { PITCH_TYPES, type DashboardMeta } from "@/lib/data";
import { MANO_LABEL, SEDE_CORTA, TIPO_LABEL, fmt1 } from "@/lib/format";
import type { PitchType, SedeKey } from "@/lib/simulator";
import { DECIMALES as D, MAX_PITCHES, MIN_PITCHES, nuevoPitch, pitchTipico, redondear, type Draft, type DraftPitch } from "./draft";

const MEASURED_AT: SedeKey[] = ["No Altitude", "Medium Altitude", "Extreme Altitude", "Harp Helu"];

function Num({ label, unit, value, digits, onChange }: {
  label: string; unit?: string; value: number; digits: number; onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="block min-w-0 text-xs text-neutral-600">
      {label}{unit && <span className="text-neutral-400"> ({unit})</span>}
      <input
        id={id}
        type="number"
        step={10 ** -digits}
        value={redondear(value, digits)}
        onChange={(e) => {
          const v = e.target.valueAsNumber;
          // Misma precisión que muestra el campo y que guarda el link.
          if (Number.isFinite(v)) onChange(redondear(v, digits));
        }}
        className="mt-0.5 block w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm tabular-nums text-neutral-900 focus:border-accent focus:outline-none"
      />
    </label>
  );
}

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <label className="block min-w-0 text-xs text-neutral-600">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 block w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-accent focus:outline-none"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

interface Props {
  draft: Draft;
  meta: DashboardMeta;
  usoTipico: Record<PitchType, number>;
  onChange: (d: Draft) => void;
}

/** Captura del pitcher (una vez) y de cada lanzamiento de su arsenal. */
export function ArsenalEditor({ draft, meta, usoTipico, onChange }: Props) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });
  const setPitch = (id: number, patch: Partial<DraftPitch>) =>
    onChange({ ...draft, pitches: draft.pitches.map((p) => (p.id === id ? { ...p, ...patch } : p)) });

  // Al cambiar el tipo se cargan sus valores típicos; la sede propia de la fila deja de aplicar.
  const changeTipo = (p: DraftPitch, tipo: PitchType) =>
    setPitch(p.id, { ...pitchTipico(meta, tipo, p.uso), measuredAt: undefined });

  const add = () => {
    const usados = new Set(draft.pitches.map((p) => p.tipo));
    const tipo = PITCH_TYPES.find((t) => !usados.has(t)) ?? "Four-Seam";
    onChange({ ...draft, pitches: [...draft.pitches, nuevoPitch(meta, tipo, Math.round(usoTipico[tipo]))] });
  };
  const remove = (id: number) => onChange({ ...draft, pitches: draft.pitches.filter((p) => p.id !== id) });

  const suma = draft.pitches.reduce((s, p) => s + Math.max(0, p.uso || 0), 0);

  return (
    <Card>
      <CardTitle sub="Los datos de Trackman del candidato, de cualquier liga. Lo horizontal se captura hacia el lado del brazo, también para zurdos.">
        El candidato
      </CardTitle>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Select
          label="Mano" value={draft.mano}
          options={(["Right", "Left"] as const).map((m) => ({ value: m, label: MANO_LABEL[m] }))}
          onChange={(v) => set("mano", v as Draft["mano"])}
        />
        <Select
          label="¿Dónde se midieron los datos?" value={draft.measuredAt}
          options={MEASURED_AT.map((k) => ({ value: k, label: SEDE_CORTA[k] }))}
          onChange={(v) => set("measuredAt", v as SedeKey)}
        />
        <Num label="Extensión" unit="ft" digits={D.liberacion} value={draft.Extension} onChange={(v) => set("Extension", v)} />
        <Num label="Altura de liberación" unit="ft" digits={D.liberacion} value={draft.RelHeight} onChange={(v) => set("RelHeight", v)} />
        <Num label="Lado de liberación" unit="ft" digits={D.liberacion} value={draft.rel_side_arm} onChange={(v) => set("rel_side_arm", v)} />
      </div>

      <h3 className="mt-6 text-sm font-semibold text-neutral-900">Lanzamientos</h3>
      <ul className="mt-2 space-y-3">
        {draft.pitches.map((p, i) => (
          <li key={p.id} className="rounded-md border border-neutral-200 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-neutral-500">
                Lanzamiento {i + 1}
                {p.measuredAt && p.measuredAt !== draft.measuredAt && (
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-700">
                    Medido en: {SEDE_CORTA[p.measuredAt]}
                  </span>
                )}
              </span>
              {draft.pitches.length > MIN_PITCHES && (
                <button type="button" onClick={() => remove(p.id)} className="shrink-0 text-xs text-neutral-500 hover:text-accent">
                  Quitar
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-[1.7fr_repeat(6,minmax(0,1fr))]">
              <div className="col-span-2 sm:col-span-2 lg:col-span-1">
                <Select
                  label="Tipo" value={p.tipo}
                  options={PITCH_TYPES.map((t) => ({ value: t, label: TIPO_LABEL[t] }))}
                  onChange={(v) => changeTipo(p, v as PitchType)}
                />
              </div>
              <Num label="Uso" unit="%" digits={D.uso} value={p.uso} onChange={(v) => setPitch(p.id, { uso: v })} />
              <Num label="Velocidad" unit="mph" digits={D.velocidad} value={p.RelSpeed} onChange={(v) => setPitch(p.id, { RelSpeed: v })} />
              <Num label="IVB" unit="in" digits={D.movimiento} value={p.ivb} onChange={(v) => setPitch(p.id, { ivb: v })} />
              <Num label="HB" unit="in" digits={D.movimiento} value={p.hb_arm} onChange={(v) => setPitch(p.id, { hb_arm: v })} />
              <Num label="Giro" unit="rpm" digits={D.giro} value={p.SpinRate} onChange={(v) => setPitch(p.id, { SpinRate: v })} />
              <Num label="Eje" unit="°" digits={D.eje} value={p.spin_axis_m} onChange={(v) => setPitch(p.id, { spin_axis_m: v })} />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-600">
          Suma de uso: <span className="font-medium tabular-nums text-neutral-900">{fmt1(suma)}%</span>. Al calificar,
          el uso se normaliza para que sume 100.
        </p>
        <button
          type="button" onClick={add} disabled={draft.pitches.length >= MAX_PITCHES}
          className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {draft.pitches.length >= MAX_PITCHES ? `Máximo ${MAX_PITCHES} lanzamientos` : "Agregar lanzamiento"}
        </button>
      </div>
    </Card>
  );
}
