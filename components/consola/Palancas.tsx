"use client";

import { useMemo } from "react";
import { fmtSigned } from "@/lib/format";
import { levers, tangibles, type PitchType } from "@/lib/simulator";
import type { MetaConResultados } from "@/types/resultados";
import { Panel } from "./Panel";
import { TIPO_PLURAL, mayuscula } from "./textos";

/**
 * Cambios pequeños que más suben el Stuff+ de un tipo de lanzamiento en el Harp Helú. Barras negras, la mejor en
 * rojo (lo élite) y las que no ayudan en gris. Dependen solo del tipo: son efectos promedio de la liga.
 */
export function Palancas({ meta, tipo, titulo = "Palancas en el Harp Helú", ancho = 5, soloUtiles = false, className }: {
  meta: MetaConResultados;
  tipo: PitchType;
  titulo?: string;
  ancho?: 5 | 12 | 7 | 6;
  soloUtiles?: boolean;
  className?: string;
}) {
  const lista = useMemo(() => levers(meta, tipo, "Harp Helu"), [meta, tipo]);
  const visibles = soloUtiles ? lista.filter((l) => l.ayuda) : lista;
  const maximo = Math.max(...lista.map((l) => Math.abs(l.ganancia)), 0.01);
  return (
    <Panel
      ancho={ancho}
      className={className}
      titulo={titulo}
      meta="Puntos de Stuff+ por un cambio pequeño"
      pie={`Efecto promedio sobre miles de ${TIPO_PLURAL[tipo]} reales de la liga en altitud extrema. Son asociaciones aprendidas por el modelo: indican hacia dónde dirigir el desarrollo; su factibilidad depende de cada pitcher.`}
    >
      {visibles.length === 0 ? (
        <p className="pb text-sm text-grafito">Ningún cambio pequeño mejora este lanzamiento de forma apreciable.</p>
      ) : (
        <ul className="lev">
          {visibles.map((l, i) => {
            const t = tangibles(meta, l.ganancia);
            const clase = !l.ayuda ? "off" : i === 0 ? "top1" : "";
            return (
              <li key={l.campo} className={clase}>
                <span>{mayuscula(l.accion)}</span>
                <span className="lb" aria-hidden="true">
                  <i style={{ width: `${(100 * Math.max(0, l.ganancia)) / maximo}%` }} />
                </span>
                <span className="lg num">{fmtSigned(l.ganancia, 1)}</span>
                <span className="lt">
                  {!l.ayuda ? "No ayuda de forma apreciable" : t ? `${fmtSigned(t.whiffPp, 1)} pp de fallos por swing` : l.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
