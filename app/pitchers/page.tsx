import { EnLienzo } from "@/components/consola/Vista";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PitchersBoard } from "@/components/pitchers/PitchersBoard";

export const metadata: Metadata = { title: "Pitchers" };

export default function PitchersPage() {
  return (
    <EnLienzo>
    <Suspense fallback={<p className="py-12 text-center text-sm text-neutral-500">Cargando pitchers…</p>}>
      <PitchersBoard />
    </Suspense>
    </EnLienzo>
  );
}
