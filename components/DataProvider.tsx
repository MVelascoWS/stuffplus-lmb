"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadDashboardData, type DashboardData } from "@/lib/data";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardData };

const DataContext = createContext<State>({ status: "loading" });

/** Vive en el layout raíz, así los datos sobreviven a la navegación entre vistas. */
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    loadDashboardData()
      .then((data) => alive && setState({ status: "ready", data }))
      .catch((e: Error) => alive && setState({ status: "error", message: e.message }));
    return () => { alive = false; };
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export const useDashboardData = () => useContext(DataContext);

/** Muestra un aviso mientras cargan los datos y entrega el contenido cuando están listos. */
export function WithData({ children }: { children: (data: DashboardData) => ReactNode }) {
  const state = useDashboardData();
  if (state.status === "error") {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        No se pudieron cargar los datos del tablero: {state.message}. Recarga la página para intentar de nuevo.
      </p>
    );
  }
  if (state.status === "loading") {
    return <p className="animate-pulse py-12 text-center text-sm text-neutral-500">Cargando datos…</p>;
  }
  return <>{children(state.data)}</>;
}
