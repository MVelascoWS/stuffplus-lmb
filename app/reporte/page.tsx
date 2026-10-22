import type { Metadata } from "next";
import { IcoCargar, IcoExterno } from "@/components/consola/Iconos";
import { Panel } from "@/components/consola/Panel";
import { Vista } from "@/components/consola/Vista";
import { ReportFrame } from "@/components/reporte/ReportFrame";
import { REPORTE_SRC } from "@/components/reporte/ruta";

export const metadata: Metadata = { title: "Reporte" };

export default function ReportePage() {
  return (
    <Vista
      titulo="Reporte técnico"
      descripcion="El documento completo: método, física, perfil ideal para el Harp Helú, recomendaciones y alcance."
      acciones={
        <>
          <a className="btn" href={REPORTE_SRC} target="_blank" rel="noopener"><IcoExterno />Abrir en otra pestaña</a>
          <a className="btn prim" href="/reporte.pdf" download><IcoCargar />Descargar PDF</a>
        </>
      }
    >
      <Panel ancho={12} titulo="Stuff+ calibrado por altitud" meta="Reporte técnico, también disponible en PDF">
        <ReportFrame />
      </Panel>
    </Vista>
  );
}
