import type { Metadata, Viewport } from "next";
import { DataProvider } from "@/components/DataProvider";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Stuff+ por altitud · LMB", template: "%s · Stuff+ por altitud" },
  description:
    "Métrica de calidad de pitcheo para la Liga Mexicana de Béisbol que incorpora la física del aire delgado, con un simulador para el Estadio Alfredo Harp Helú.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <DataProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
          <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
            Datos Trackman de la LMB con pitchers anónimos. Todo el cálculo ocurre en tu navegador.
          </footer>
        </DataProvider>
      </body>
    </html>
  );
}
