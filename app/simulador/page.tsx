import type { Metadata } from "next";
import { Suspense } from "react";
import { Simulator } from "@/components/simulador/Simulator";
import { PageIntro } from "@/components/ui";

export const metadata: Metadata = { title: "Simulador" };

export default function SimuladorPage() {
  return (
    <>
      <PageIntro title="¿Cómo rinde este lanzamiento en la Ciudad de México?">
        <p>
          Describe un lanzamiento con sus números de Trackman y el simulador lo traslada a cada tipo de sede: le quita
          el movimiento que el aire delgado le quita a la pelota y lo vuelve a calificar con el modelo.
        </p>
        <p>
          Stuff+ compara contra los lanzamientos que se tiran en el mismo tipo de sede: 100 es el promedio y cada
          10 puntos son una desviación estándar.
        </p>
      </PageIntro>
      <Suspense fallback={<p className="py-12 text-center text-sm text-neutral-500">Cargando simulador…</p>}>
        <Simulator />
      </Suspense>
    </>
  );
}
