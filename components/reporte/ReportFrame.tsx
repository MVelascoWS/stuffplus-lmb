"use client";

import { useEffect, useRef, useState } from "react";

// En el sitio exportado el reporte se publica en /reporte-tecnico/ (ver scripts/publicar-reporte.mjs);
// en desarrollo se sirve directo desde public/.
const SRC = process.env.NODE_ENV === "development" ? "/reporte.html" : "/reporte-tecnico/";

/** Muestra el reporte técnico dentro del sitio, con la altura de su contenido para evitar un doble scroll. */
export function ReportFrame() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1200);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let observer: ResizeObserver | null = null;
    // Se suma el borde del iframe (1 px arriba y abajo) para que no aparezca scroll interno.
    const measure = (doc: Document) => setHeight(doc.documentElement.scrollHeight + 2);
    const fit = () => {
      const doc = el.contentDocument;
      if (!doc?.body) return;
      measure(doc);
      observer?.disconnect();
      observer = new ResizeObserver(() => measure(doc));
      observer.observe(doc.body);
    };
    el.addEventListener("load", fit);
    // El iframe puede haber cargado antes de que corra este efecto.
    if (el.contentDocument?.readyState === "complete") fit();
    return () => {
      el.removeEventListener("load", fit);
      observer?.disconnect();
    };
  }, []);

  const print = () => frame.current?.contentWindow?.print();

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <a
          href={SRC}
          target="_blank"
          rel="noopener"
          className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-neutral-800 hover:bg-neutral-100"
        >
          Abrir en otra pestaña
        </a>
        <button
          type="button"
          onClick={print}
          className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-neutral-800 hover:bg-neutral-100"
        >
          Imprimir o guardar como PDF
        </button>
        <a href="/reporte.pdf" download className="rounded bg-accent px-3 py-1.5 font-medium text-white hover:bg-red-800">
          Descargar PDF
        </a>
      </div>
      <iframe
        ref={frame}
        src={SRC}
        title="Reporte técnico"
        className="block w-full rounded-lg border border-neutral-200 bg-white"
        style={{ height }}
      />
    </>
  );
}
