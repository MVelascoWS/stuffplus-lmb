// Íconos de trazo de la consola (20 × 20, sin relleno). Son decorativos: el texto junto a ellos da el sentido.
import type { ReactNode } from "react";

function Ico({ children }: { children: ReactNode }) {
  return <svg className="ico" viewBox="0 0 20 20" aria-hidden="true">{children}</svg>;
}

export const IcoResumen = () => <Ico><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="11" y="3" width="6" height="6" rx="1" /><rect x="3" y="11" width="6" height="6" rx="1" /><rect x="11" y="11" width="6" height="6" rx="1" /></Ico>;
export const IcoSimulador = () => <Ico><circle cx="10" cy="10" r="7" /><circle cx="10" cy="10" r="2.5" /><path d="M10 1v3M10 16v3M1 10h3M16 10h3" /></Ico>;
export const IcoCandidato = () => <Ico><circle cx="8" cy="7" r="3.2" /><path d="M2.5 17c.7-3 3-4.6 5.5-4.6s4.8 1.6 5.5 4.6M15 6v6M12 9h6" /></Ico>;
export const IcoPitchers = () => <Ico><path d="M3 5h14M3 10h14M3 15h9" /></Ico>;
export const IcoFisica = () => <Ico><path d="M3 15c3-9 9-12 14-12" /><circle cx="16" cy="4" r="1.6" /><path d="M3 18h14" strokeDasharray="2 2" /></Ico>;
export const IcoModelo = () => <Ico><path d="M3 17V9M8 17V5M13 17v-6M18 17V3" /></Ico>;
export const IcoReporte = () => <Ico><path d="M5 2h7l4 4v12H5z" /><path d="M12 2v4h4M8 11h5M8 14h5" /></Ico>;
export const IcoCargar = () => <Ico><path d="M10 3v10M6 9l4 4 4-4M4 17h12" /></Ico>;
export const IcoLink = () => <Ico><path d="M8 12l4-4M7 9.5 5.2 11.3a2.6 2.6 0 0 0 3.7 3.7L10.7 13M13 10.5l1.8-1.8a2.6 2.6 0 0 0-3.7-3.7L9.3 7" /></Ico>;
export const IcoLectura = () => <Ico><path d="M7 14h6M8 17h4M10 3a5 5 0 0 0-3 9c.6.5 1 1.2 1 2h4c0-.8.4-1.5 1-2a5 5 0 0 0-3-9z" /></Ico>;
export const IcoMas = () => <Ico><path d="M10 4v12M4 10h12" /></Ico>;
export const IcoExterno = () => <Ico><path d="M11 3h6v6M17 3l-8 8M14 12v4H4V6h4" /></Ico>;
export const IcoFlecha = () => <Ico><path d="M4 10h12M11 5l5 5-5 5" /></Ico>;
