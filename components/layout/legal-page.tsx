import type { ReactNode } from "react";

/** Plantilla para páginas de texto legal o informativo. */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black tracking-tight text-unis-text">{title}</h1>
      <p className="mt-2 text-sm text-unis-gray">Última actualización: {updated}</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-unis-text [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-unis-red [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
