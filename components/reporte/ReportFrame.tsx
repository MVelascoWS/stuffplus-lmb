"use client";

import { useEffect, useRef, useState } from "react";

import { REPORTE_SRC } from "./ruta";

/** Muestra el reporte técnico dentro del sitio, con la altura de su contenido para evitar un doble scroll. */
export function ReportFrame() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1200);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let observer: ResizeObserver | null = null;
    const measure = (doc: Document) => setHeight(doc.documentElement.scrollHeight);
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

  return (
    <iframe
      ref={frame}
      src={REPORTE_SRC}
      title="Reporte técnico"
      className="block w-full rounded-b-lg border-0 bg-papel"
      style={{ height }}
    />
  );
}
