"use client";

import { useEffect, useState } from "react";

// Archivos de public/data/ que solo usan algunas vistas. Igual que los datos generales, cada uno se
// descarga una vez por visita y se reutiliza.
const cache = new Map<string, Promise<unknown>>();

function load<T>(name: string): Promise<T> {
  let p = cache.get(name);
  if (!p) {
    p = fetch(`/data/${name}`).then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar ${name} (${res.status})`);
      return res.json();
    });
    // Si la descarga falla, se permite reintentar en la siguiente visita a una vista.
    p.catch(() => cache.delete(name));
    cache.set(name, p);
  }
  return p as Promise<T>;
}

export function useJson<T>(name: string): { data?: T; error?: string } {
  const [state, setState] = useState<{ data?: T; error?: string }>({});
  useEffect(() => {
    let alive = true;
    load<T>(name)
      .then((data) => alive && setState({ data }))
      .catch((e: Error) => alive && setState({ error: e.message }));
    return () => { alive = false; };
  }, [name]);
  return state;
}
