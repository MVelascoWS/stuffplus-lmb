/**
 * Después de `next build`: mueve la copia exportada de public/reporte.html a out/reporte-tecnico/.
 *
 * Next copia public/reporte.html a out/reporte.html, y algunos hostings (Vercel entre ellos) sirven ese
 * archivo en /reporte/, tapando la vista del dashboard con el mismo nombre. El original en public/ no se toca.
 */
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { join } from "node:path";

const out = join(import.meta.dirname, "..", "out");
const src = join(out, "reporte.html");
const destDir = join(out, "reporte-tecnico");

if (!existsSync(src)) {
  console.error("No se encontró out/reporte.html; ¿corrió next build con output: \"export\"?");
  process.exit(1);
}
mkdirSync(destDir, { recursive: true });
renameSync(src, join(destDir, "index.html"));
console.log("Reporte técnico publicado en /reporte-tecnico/");
