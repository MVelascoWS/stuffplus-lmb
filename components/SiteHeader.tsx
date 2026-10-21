"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/simulador/", label: "Simulador" },
  { href: "/pitchers/", label: "Pitchers" },
  { href: "/fisica/", label: "Física" },
  { href: "/modelo/", label: "Modelo" },
  { href: "/reporte/", label: "Reporte" },
];

const normalize = (p: string) => (p.endsWith("/") ? p : `${p}/`);

export function SiteHeader() {
  const path = normalize(usePathname() ?? "/");
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-base font-semibold tracking-tight text-neutral-900">
          Stuff+ <span className="text-accent">por altitud</span>
        </Link>
        <nav aria-label="Secciones" className="-mx-2 flex flex-wrap">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded px-2 py-1 text-sm ${
                  active ? "font-medium text-accent" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
