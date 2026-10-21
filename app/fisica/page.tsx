import type { Metadata } from "next";
import { Physics } from "@/components/fisica/Physics";

export const metadata: Metadata = { title: "Física" };

export default function FisicaPage() {
  return <Physics />;
}
