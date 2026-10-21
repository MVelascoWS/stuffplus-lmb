// Piezas de presentación compartidas por las vistas.
import type { ReactNode } from "react";

/** Encabezado de vista: título y una o dos frases en lenguaje llano antes de cualquier número. */
export function PageIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{title}</h1>
      <div className="mt-3 space-y-2 text-base leading-relaxed text-neutral-700">{children}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-neutral-200 bg-white p-4 sm:p-5 ${className}`}>{children}</section>;
}

export function CardTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-neutral-900">{children}</h2>
      {sub && <p className="mt-1 text-sm text-neutral-600">{sub}</p>}
    </div>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-3xl font-semibold tabular-nums text-accent">{value}</div>
      <div className="mt-1 text-sm leading-snug text-neutral-600">{label}</div>
    </div>
  );
}

/** Leyenda simple para gráficas: un cuadro de color junto a su nombre. */
export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
