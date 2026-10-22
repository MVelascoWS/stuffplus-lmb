import type { Metadata } from "next";
import { Suspense } from "react";
import { Candidatos } from "@/components/candidatos/Candidatos";

export const metadata: Metadata = { title: "Evaluar candidato" };

export default function CandidatosPage() {
  return (
    <Suspense>
      <Candidatos />
    </Suspense>
  );
}
