"use client";

import { useId } from "react";

interface Props {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  range: [number, number];
  step: number;
  digits: number;
  hint?: string;
}

/** Control deslizante con caja numérica, para mover el valor o capturarlo exacto. */
export function NumberField({ label, unit, value, onChange, range, step, digits, hint }: Props) {
  const id = useId();
  // Un lanzamiento real puede salir del rango observado; el control se amplía para mostrarlo.
  const min = Math.min(range[0], value);
  const max = Math.max(range[1], value);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm text-neutral-800">
          {label}
        </label>
        <span className="flex shrink-0 items-baseline gap-1">
          <input
            type="number"
            aria-label={`${label} (${unit})`}
            className="w-20 rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-right text-sm tabular-nums focus:border-accent focus:outline-none"
            value={Number(value.toFixed(digits))}
            step={step}
            onChange={(e) => {
              const v = e.target.valueAsNumber;
              if (Number.isFinite(v)) onChange(v);
            }}
          />
          <span className="w-7 text-xs text-neutral-500">{unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="mt-1 w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
      />
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
