"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useDashboardData } from "@/components/DataProvider";
import {
  IcoCandidato, IcoFisica, IcoFlecha, IcoModelo, IcoPitchers, IcoReporte, IcoSimulador,
} from "@/components/consola/Iconos";
import { Kpis, Lectura, Panel } from "@/components/consola/Panel";
import { Cargando, ErrorDatos, Vista } from "@/components/consola/Vista";
import type { DashboardMeta } from "@/lib/data";
import { TIPO_CON_ARTICULO, fmt0, fmt1, fmt2, fmtSigned } from "@/lib/format";
import { conResultados } from "@/types/resultados";

const VISTAS: { href: string; titulo: string; texto: string; Icono: ComponentType }[] = [
  { href: "/simulador/", titulo: "Simulador", texto: "Califica un lanzamiento en cada tipo de sede y ve qué cambiar para el Harp Helú.", Icono: IcoSimulador },
  { href: "/candidatos/", titulo: "Evaluar candidato", texto: "Califica el arsenal de un pitcher de cualquier liga y compáralo con la LMB.", Icono: IcoCandidato },
  { href: "/pitchers/", titulo: "Pitchers", texto: "¿Quién viaja bien a la CDMX? Stuff+ proyectado de cada pitcher y su arsenal.", Icono: IcoPitchers },
  { href: "/fisica/", titulo: "Física", texto: "Las cuatro hipótesis, la pérdida de movimiento y el riesgo de contacto en altitud.", Icono: IcoFisica },
  { href: "/modelo/", titulo: "Modelo", texto: "Cómo se construyó la métrica y las validaciones que pide la convocatoria.", Icono: IcoModelo },
  { href: "/reporte/", titulo: "Reporte", texto: "El reporte técnico completo, para leer o descargar en PDF.", Icono: IcoReporte },
];

const TITULO = "Resumen";
const DESCRIPCION = "Stuff+ calibrado por altitud para la LMB: el hallazgo principal y acceso a cada vista.";

/** El tamaño de muestra más chico con el que Stuff+ predice mejor que el resultado real. */
function smallestWinningSample(meta: DashboardMeta) {
  return [...meta.validation.small_sample].sort((a, b) => a.N - b.N).find((s) => s.stuff > s.rv) ?? null;
}

function lista(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

export function Home() {
  const estado = useDashboardData();
  if (estado.status !== "ready") {
    return (
      <Vista titulo={TITULO} descripcion={DESCRIPCION}>
        {estado.status === "error" ? <ErrorDatos mensaje={estado.message} /> : <Cargando />}
      </Vista>
    );
  }
  const { meta } = estado.data;
  const loss = meta.perdida_mov_tipo.observado_promedio;
  const sample = smallestWinningSample(meta);
  const deltas = [...meta.delta_tipo_proyectado].sort((a, b) => b.delta - a.delta);
  const winners = deltas.filter((d) => d.delta > 0).slice(0, 2);
  const loser = deltas[deltas.length - 1];
  const describe = (d: (typeof deltas)[number]) => `${TIPO_CON_ARTICULO[d.tipo]} (${fmtSigned(d.delta)})`;
  const ds = meta.dataset;
  const reduccion = conResultados(meta).projection_validation.reduccion_error_pct;

  return (
    <Vista titulo={TITULO} descripcion={DESCRIPCION}>
      <Panel ancho={12} titulo="Indicadores" meta={`Datos Trackman de la LMB, ${ds.temporadas[0]} a ${ds.temporadas[ds.temporadas.length - 1]}, pitchers anónimos`}>
        <Kpis
          items={[
            { k: "Lanzamientos analizados", v: fmt0(ds.lanzamientos), d: `De ${fmt0(ds.pitchers)} pitchers en ${fmt0(ds.juegos)} juegos` },
            { k: "Movimiento perdido en altitud extrema", v: `${fmtSigned(loss, 1)}%`, tono: "r", d: "Frente a sedes a nivel del mar, mismo pitcher y lanzamiento" },
            sample
              ? { k: "Lanzamientos para que Stuff+ prediga mejor que el resultado", v: fmt0(sample.N), d: `Correlación ${fmt2(sample.stuff)} contra ${fmt2(sample.rv)}` }
              : { k: "Lanzamientos para que Stuff+ prediga mejor que el resultado", v: "—" },
            { k: "Menos error al anticipar el Stuff+ en altitud", v: `${fmt0(reduccion)}%`, d: "Con pitchers que el modelo no vio" },
          ]}
        />
      </Panel>

      <Panel ancho={7} titulo="Hallazgo principal" meta="Lo que cambia en el Estadio Alfredo Harp Helú">
        <div className="pb">
          <p className="m-0 text-[20px] font-bold leading-snug" style={{ fontStretch: "105%" }}>
            En altitud extrema los lanzamientos pierden {fmt1(Math.abs(loss))}% de su movimiento, pero no todos por igual.
          </p>
          <p className="m-0 mt-3 text-[14px] leading-relaxed">
            La pérdida se midió comparando a cada pitcher consigo mismo, con el mismo lanzamiento, entre sedes de altitud
            extrema y a nivel del mar. Como Stuff+ compara contra los lanzamientos del mismo tipo de sede, lo que importa es
            quién pierde menos que los demás.
          </p>
        </div>
        <Lectura>
          En el Harp Helú ganan terreno <b>{lista(winners.map(describe))}</b>, y lo pierde {describe(loser)}.
        </Lectura>
      </Panel>

      <Panel ancho={5} titulo="Vistas" meta="Cada herramienta de la consola">
        <ul className="m-0 list-none p-0">
          {VISTAS.map(({ href, titulo, texto, Icono }) => (
            <li key={href} className="border-b border-linea last:border-b-0">
              <Link href={href} className="group grid grid-cols-[18px_minmax(0,1fr)_18px] items-start gap-3 px-[18px] py-3 hover:bg-[#faf9f8]">
                <Icono />
                <span>
                  <span className="block font-semibold">{titulo}</span>
                  <span className="block text-[13px] text-grafito">{texto}</span>
                </span>
                <span className="text-grafito group-hover:text-tinta"><IcoFlecha /></span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </Vista>
  );
}
