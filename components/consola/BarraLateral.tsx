"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardData } from "@/components/DataProvider";
import { fmt0 } from "@/lib/format";
import {
  IcoCandidato, IcoFisica, IcoModelo, IcoPitchers, IcoReporte, IcoResumen, IcoSimulador,
} from "./Iconos";

const VISTAS = [
  { href: "/", label: "Resumen", Icono: IcoResumen },
  { href: "/simulador/", label: "Simulador", Icono: IcoSimulador },
  { href: "/candidatos/", label: "Evaluar candidato", Icono: IcoCandidato },
  { href: "/pitchers/", label: "Pitchers", Icono: IcoPitchers },
  { href: "/fisica/", label: "Física", Icono: IcoFisica },
  { href: "/modelo/", label: "Modelo", Icono: IcoModelo },
  { href: "/reporte/", label: "Reporte", Icono: IcoReporte },
];

const normalizar = (p: string) => (p.endsWith("/") ? p : `${p}/`);

/** Navegación principal; bajo 820 px se convierte en barra superior desplazable (ver globals.css). */
export function BarraLateral() {
  const ruta = normalizar(usePathname() ?? "/");
  const estado = useDashboardData();
  const ds = estado.status === "ready" ? estado.data.meta.dataset : null;
  return (
    <aside className="lat" aria-label="Navegación" data-scroll-x>
      <Link href="/" className="marca"><b aria-hidden="true" />Stuff+ LMB</Link>
      <nav className="nav">
        {VISTAS.map(({ href, label, Icono }) => (
          <Link key={href} href={href} className="ni" aria-current={ruta === href ? "page" : undefined}>
            <Icono />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      {ds && (
        <div className="estado">
          <span className="ok">Modelo validado</span>
          <strong className="num">{fmt0(ds.lanzamientos)} lanzamientos</strong>
          <span>
            LMB {ds.temporadas[0]} a {ds.temporadas[ds.temporadas.length - 1]}, {fmt0(ds.pitchers)} pitchers anónimos
          </span>
        </div>
      )}
    </aside>
  );
}
