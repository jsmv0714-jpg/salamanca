"use client";

import "./globals.css";
import { useEffect } from "react";

/**
 * Se muestra cuando falla el layout raíz (cabecera o pie incluidos), así que
 * debe traer su propio `<html>` y `<body>`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error general de la aplicación:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center bg-unis-bg px-4 antialiased">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-unis-red">Algo salió mal</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-unis-text sm:text-4xl">
            No pudimos cargar el Marketplace
          </h1>
          <p className="mt-3 text-sm text-unis-gray">
            Puede ser un problema temporal. Vuelve a intentarlo; si sigue ocurriendo, escríbenos.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-md bg-unis-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
            >
              Reintentar
            </button>
            {/* Enlace normal a propósito: si falla el layout, el router de Next puede no estar disponible. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="rounded-md border border-unis-lightgray bg-white px-5 py-2.5 text-sm font-medium text-unis-gray transition hover:border-unis-red hover:text-unis-red"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
