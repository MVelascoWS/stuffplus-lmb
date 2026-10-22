import type { ReactNode } from "react";

/** Encabezado fijo de la vista (título, una línea de descripción y acciones) sobre el lienzo de 12 columnas. */
export function Vista({ titulo, descripcion, acciones, children }: {
  titulo: string;
  descripcion: string;
  acciones?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <header className="top">
        <div className="min-w-0">
          <h1>{titulo}</h1>
          <p>{descripcion}</p>
        </div>
        {acciones && <div className="acciones">{acciones}</div>}
      </header>
      <div className="lienzo">{children}</div>
    </>
  );
}

/** Ocupa el ancho completo del lienzo mientras llegan los datos. */
export function Cargando({ texto = "Cargando datos…" }: { texto?: string }) {
  return <p className="c12 py-12 text-center text-sm text-grafito motion-safe:animate-pulse">{texto}</p>;
}

export function ErrorDatos({ mensaje }: { mensaje: string }) {
  return (
    <p className="c12 rounded-lg border border-linea bg-papel p-4 text-sm">
      No se pudieron cargar los datos: {mensaje}. Recarga la página para intentar de nuevo.
    </p>
  );
}

/** Contenido de ancho completo sobre el lienzo, para vistas que aún no se dividen en paneles. */
export function EnLienzo({ children }: { children: ReactNode }) {
  return <div className="lienzo"><div className="c12 min-w-0">{children}</div></div>;
}
