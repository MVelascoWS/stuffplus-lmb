// Traducción de un cambio de Stuff+ a lo que se ve en el campo, con un decimal.
import { fmt1, fmtSigned } from "@/lib/format";
import { tangibles, type Meta } from "@/lib/simulator";

export interface Equivalencia {
  /** "+0.6 puntos porcentuales de fallos por swing" */
  fallos: string;
  /** "0.7 carreras menos por cada 1,000 lanzamientos" */
  carreras: string;
}

export function equivalencia(meta: Meta, deltaStuff: number): Equivalencia | null {
  const t = tangibles(meta, deltaStuff);
  if (!t) return null;
  // carrerasPor1000 negativo significa menos carreras permitidas.
  const runs = t.carrerasPor1000;
  return {
    fallos: `${fmtSigned(t.whiffPp, 1)} puntos porcentuales de fallos por swing`,
    carreras: `${fmt1(Math.abs(runs))} carreras ${runs <= 0 ? "menos" : "más"} por cada 1,000 lanzamientos`,
  };
}
