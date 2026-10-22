import type { Metadata } from "next";
import { Suspense } from "react";
import { PitchersBoard } from "@/components/pitchers/PitchersBoard";

export const metadata: Metadata = { title: "Pitchers" };

export default function PitchersPage() {
  return (
    <Suspense>
      <PitchersBoard />
    </Suspense>
  );
}
