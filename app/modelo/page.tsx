import type { Metadata } from "next";
import { ModelView } from "@/components/modelo/ModelView";

export const metadata: Metadata = { title: "Modelo" };

export default function ModeloPage() {
  return <ModelView />;
}
