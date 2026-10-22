import { Card, CardTitle } from "@/components/ui";
import { SEDE_CORTA, fmt0, fmt2 } from "@/lib/format";
import type { MetaConvocatoria } from "@/types/convocatoria";

/** H3: cuánto más cuesta un elevado que un rodado en cada tipo de sede. */
export function Rodados({ meta }: { meta: MetaConvocatoria }) {
  const { elevado_menos_rodado: em, corr_rodados_vs_carreras: cr } = meta.contacto.h3;
  const sedes = [
    { k: "mar" as const, label: SEDE_CORTA["No Altitude"] },
    { k: "extrema" as const, label: SEDE_CORTA["Extreme Altitude"] },
  ];
  const maximo = Math.max(em.mar, em.extrema);
  return (
    <Card className="mt-6">
      <CardTitle sub="Cuántas carreras más cuesta, en promedio, que un lanzamiento termine en elevado en lugar de rodado.">
        H3: el costo de un elevado frente a un rodado
      </CardTitle>
      <ul className="space-y-3">
        {sedes.map(({ k, label }) => (
          <li key={k}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-neutral-700">{label}</span>
              <span className="tabular-nums">
                <strong className="text-lg font-semibold text-neutral-900">+{fmt2(em[k])}</strong>{" "}
                <span className="text-xs text-neutral-500">carreras</span>
              </span>
            </div>
            <div className="mt-1 h-2.5 w-full rounded-sm bg-neutral-100">
              <div
                className="h-full rounded-sm"
                style={{ width: `${(100 * em[k]) / maximo}%`, background: k === "extrema" ? "var(--chart-main)" : "var(--chart-ref)" }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-neutral-700">
        El porcentaje de rodados de un pitcher se correlaciona con las carreras que permite: {fmt2(cr.extrema.corr)} en
        altitud extrema (intervalo de 95%: {fmt2(cr.extrema.ic95[0])} a {fmt2(cr.extrema.ic95[1])}; {fmt0(cr.extrema.n)}{" "}
        pitchers) y {fmt2(cr.mar.corr)} sin altitud ({fmt2(cr.mar.ic95[0])} a {fmt2(cr.mar.ic95[1])}; {fmt0(cr.mar.n)} pitchers)
        {cr.mar.ic95[0] <= 0 && cr.mar.ic95[1] >= 0 ? ", que no se distingue de cero" : ""}.
      </p>
    </Card>
  );
}
