import type { ReactNode } from "react";

export interface ColumnaLS {
  key: string;
  label: ReactNode;
  sub?: ReactNode;
  /** columna del Harp Helú: encabezado rojo y celdas en rojo suave */
  hh?: boolean;
  /** columna de diferencia o total: separador negro a la izquierda */
  tot?: boolean;
  /** columna de texto (alineada a la izquierda, sin cifra condensada) */
  txt?: boolean;
}

export interface FilaLS {
  key: string;
  label: ReactNode;
  celdas: Record<string, ReactNode>;
  /** fila principal, con cifras grandes */
  main?: boolean;
  /** la etiqueta es un equipo (A, B, C) */
  team?: boolean;
}

/**
 * Resultados como el marcador de un partido: las sedes son las columnas y la última columna es la diferencia,
 * como las carreras totales. Se desplaza horizontalmente dentro de su panel en pantallas angostas.
 */
export function LineScore({ titulo, columnas, filas, className = "" }: {
  titulo: ReactNode;
  columnas: ColumnaLS[];
  filas: FilaLS[];
  className?: string;
}) {
  const clase = (c: ColumnaLS) => [c.hh && "hh", c.tot && "tot", c.txt && "txt"].filter(Boolean).join(" ");
  return (
    <div className="ls-wrap" data-scroll-x>
      <table className={`ls ${className}`}>
        <thead>
          <tr>
            <th scope="col">{titulo}</th>
            {columnas.map((c) => (
              <th key={c.key} scope="col" className={clase(c)} style={c.txt ? { textAlign: "left" } : undefined}>
                {c.label}
                {c.sub && <span>{c.sub}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.key} className={f.main ? "main" : undefined}>
              <th scope="row" className={f.team ? "team num" : undefined}>{f.label}</th>
              {columnas.map((c) => (
                <td key={c.key} className={`${c.txt ? "" : "num"} ${clase(c)}`}>{f.celdas[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
