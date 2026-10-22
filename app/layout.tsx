import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { DataProvider } from "@/components/DataProvider";
import { BarraLateral } from "@/components/consola/BarraLateral";
import "./globals.css";

// Archivo con su eje de ancho: las cifras se muestran condensadas al 70% (clase .num en globals.css).
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], display: "swap", variable: "--font-archivo" });

export const metadata: Metadata = {
  title: { default: "Stuff+ LMB", template: "%s · Stuff+ LMB" },
  description:
    "Métrica de calidad de pitcheo para la Liga Mexicana de Béisbol que incorpora la física del aire delgado, con un simulador para el Estadio Alfredo Harp Helú.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={archivo.variable}>
      <body>
        <DataProvider>
          <div className="app">
            <BarraLateral />
            <div className="cont">{children}</div>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
