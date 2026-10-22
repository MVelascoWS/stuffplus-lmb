import type { ReactNode } from "react";
import { IcoLectura } from "./Iconos";

type Ancho = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;

/** Panel blanco del lienzo, con encabezado (título, metadatos y controles) y pie opcional. */
export function Panel({ titulo, meta, controles, ancho = 12, pie, className = "", id, children }: {
  titulo: ReactNode;
  meta?: ReactNode;
  controles?: ReactNode;
  ancho?: Ancho;
  pie?: ReactNode;
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  const tituloId = id ? `${id}-t` : undefined;
  return (
    <section id={id} className={`panel c${ancho} ${className}`} aria-labelledby={tituloId}>
      <div className="ph">
        <div className="min-w-0">
          <h2 id={tituloId}>{titulo}</h2>
          {meta && <span className="meta">{meta}</span>}
        </div>
        {controles}
      </div>
      {children}
      {pie && <p className="pie">{pie}</p>}
    </section>
  );
}

/** Indicadores separados por líneas: etiqueta, cifra condensada y nota. */
export function Kpis({ items, borde = false }: {
  items: { k: ReactNode; v: ReactNode; d?: ReactNode; tono?: "r" | "nulo" }[];
  borde?: boolean;
}) {
  return (
    <div className={`kpis ${borde ? "borde" : ""}`} style={{ ["--n" as string]: items.length }}>
      {items.map((it, i) => (
        <div key={i} className="kpi">
          <span className="k">{it.k}</span>
          <span className={`v num ${it.tono ?? ""}`}>{it.v}</span>
          {it.d && <span className="d">{it.d}</span>}
        </div>
      ))}
    </div>
  );
}

/** La interpretación en lenguaje llano, al pie de un panel de resultados. */
export function Lectura({ children }: { children: ReactNode }) {
  return (
    <div className="lectura">
      <IcoLectura />
      <p>{children}</p>
    </div>
  );
}

/** Selector segmentado: la opción activa en negro. */
export function Segmentado<T extends string>({ opciones, valor, onChange, etiqueta }: {
  opciones: { value: T; label: string }[];
  valor: T;
  onChange: (v: T) => void;
  etiqueta: string;
}) {
  return (
    <div className="seg" role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={o.value} type="button" aria-pressed={valor === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
