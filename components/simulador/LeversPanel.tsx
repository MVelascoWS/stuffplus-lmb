"use client";

import { useMemo } from "react";
import { Card, CardTitle } from "@/components/ui";
import { TIPO_LABEL, fmtSigned } from "@/lib/format";
import { levers, type PitchType } from "@/lib/simulator";
import type { MetaConResultados } from "@/types/resultados";
import { equivalencia } from "./equivalencias";

/**
 * Cambios pequeños que más suben el Stuff+ de este tipo de lanzamiento en el Harp Helú.
 * Depende solo del tipo: son efectos promedio sobre lanzamientos reales, no sobre los valores capturados.
 */
export function LeversPanel({ meta, tipo, title, soloUtiles = false }: {
  meta: MetaConResultados;
  tipo: PitchType;
  /** título alterno; por defecto, la pregunta del simulador */
  title?: string;
  /** oculta los cambios que no ayudan */
  soloUtiles?: boolean;
}) {
  const list = useMemo(() => levers(meta, tipo, "Harp Helu"), [meta, tipo]);
  const helpful = list.filter((l) => l.ayuda);
  const others = soloUtiles ? [] : list.filter((l) => !l.ayuda);

  return (
    <Card>
      <CardTitle sub={`Cambios pequeños para ${TIPO_LABEL[tipo].toLowerCase()}, ordenados de mayor a menor efecto en puntos de Stuff+.`}>
        {title ?? "¿Qué mover para rendir más en el Harp Helú?"}
      </CardTitle>
      {helpful.length > 0 ? (
        <ol className="space-y-3">
          {helpful.map((l) => {
            const eq = equivalencia(meta, l.ganancia);
            return (
              <li key={l.campo} className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900 first-letter:uppercase">{l.accion}</p>
                  <p className="text-xs text-neutral-500">{l.label}</p>
                  {eq && <p className="mt-1 text-xs text-neutral-600">Equivale a {eq.fallos} y {eq.carreras}.</p>}
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-semibold tabular-nums text-accent">{fmtSigned(l.ganancia, 1)}</span>
                  <span className="block text-[11px] text-neutral-500">Stuff+</span>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-neutral-600">Ningún cambio pequeño mejora este lanzamiento de forma apreciable.</p>
      )}

      {others.length > 0 && (
        <details className="mt-4 text-sm text-neutral-500">
          <summary className="cursor-pointer">Cambios que no ayudan ({others.length})</summary>
          <ul className="mt-2 space-y-1">
            {others.map((l) => (
              <li key={l.campo} className="flex justify-between gap-3">
                <span>{l.label}: {l.accion}</span>
                <span className="shrink-0 tabular-nums">{fmtSigned(l.ganancia, 1)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-4 border-t border-neutral-100 pt-3 text-xs leading-relaxed text-neutral-500">
        Efecto promedio sobre miles de lanzamientos reales de este tipo en altitud extrema. Son asociaciones aprendidas
        por el modelo: indican hacia dónde dirigir el desarrollo; su factibilidad depende de cada pitcher.
      </p>
    </Card>
  );
}
