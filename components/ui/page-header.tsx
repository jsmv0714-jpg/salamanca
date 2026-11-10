import type { ReactNode } from "react";

/** Encabezado de las listas principales: bloque azul de la marca con acento celeste. */
export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-6 rounded-3xl bg-gradient-to-br from-unis-red to-unis-red-dark px-6 py-8 text-white shadow-sm sm:px-10 sm:py-10">
      <div className="max-w-2xl">
        <span aria-hidden="true" className="mb-4 block h-1 w-12 rounded-full bg-unis-cyan" />
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-base leading-relaxed text-white/80">{description}</p>
      </div>
      {action}
    </header>
  );
}
