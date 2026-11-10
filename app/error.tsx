"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en la interfaz:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-unis-red">Algo salió mal</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-unis-text sm:text-4xl">
        No pudimos cargar esta página
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
        <Link
          href="/"
          className="rounded-md border border-unis-lightgray px-5 py-2.5 text-sm font-medium text-unis-gray transition hover:border-unis-red hover:text-unis-red"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
