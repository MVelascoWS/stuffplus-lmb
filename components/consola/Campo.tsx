"use client";

import { useId } from "react";

/** Control deslizante con su valor en cifra condensada, como en la maqueta del simulador. */
export function Campo({ label, unidad, valor, onChange, rango, paso, decimales }: {
  label: string;
  unidad: string;
  valor: number;
  onChange: (v: number) => void;
  rango: [number, number];
  paso: number;
  decimales: number;
}) {
  const id = useId();
  // Un lanzamiento real puede salir del rango observado; el control se amplía para mostrarlo.
  const min = Math.min(rango[0], valor), max = Math.max(rango[1], valor);
  const texto = valor.toLocaleString("es-MX", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  return (
    <div className="campo">
      <label htmlFor={id}>{label}</label>
      <output className="num" htmlFor={id}>{texto}<small>{unidad}</small></output>
      <input
        id={id} type="range" min={min} max={max} step={paso} value={valor}
        aria-valuetext={`${texto} ${unidad}`}
        onChange={(e) => onChange(e.target.valueAsNumber)}
      />
    </div>
  );
}
