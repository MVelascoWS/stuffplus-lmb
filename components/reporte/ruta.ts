// En el sitio exportado el reporte se publica en /reporte-tecnico/ (ver scripts/publicar-reporte.mjs);
// en desarrollo se sirve directo desde public/.
export const REPORTE_SRC = process.env.NODE_ENV === "development" ? "/reporte.html" : "/reporte-tecnico/";
