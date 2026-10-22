import type { Metadata } from "next";
import { Suspense } from "react";
import { Candidatos } from "@/components/candidatos/Candidatos";
import { PageIntro } from "@/components/ui";

export const metadata: Metadata = { title: "Evaluar candidato" };

export default function CandidatosPage() {
  return (
    <>
      <PageIntro title="Evaluar a un candidato para el Harp Helú">
        <p>
          Captura el arsenal de un pitcher de cualquier liga, sin nombre, y obtén su calificación en el Estadio Alfredo
          Harp Helú comparada contra los pitchers de la LMB. Todo se calcula en tu navegador; el link para compartir
          lleva solo los números.
        </p>
      </PageIntro>
      <Suspense fallback={<p className="py-12 text-center text-sm text-neutral-500">Cargando evaluador…</p>}>
        <Candidatos />
      </Suspense>
    </>
  );
}
