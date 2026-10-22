import { EnLienzo } from "@/components/consola/Vista";
import type { Metadata } from "next";
import { ReportFrame } from "@/components/reporte/ReportFrame";
import { PageIntro } from "@/components/ui";

export const metadata: Metadata = { title: "Reporte" };

export default function ReportePage() {
  return (
    <EnLienzo>
    <>
      <PageIntro title="Reporte técnico">
        <p>
          El documento completo: cómo se construyó la métrica, la capa física, el perfil de pitcher ideal para el Harp
          Helú, las recomendaciones y las limitaciones del análisis.
        </p>
      </PageIntro>
      <ReportFrame />
    </>
    </EnLienzo>
  );
}
