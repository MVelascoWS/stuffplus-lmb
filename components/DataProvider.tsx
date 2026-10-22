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
