import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Enlace de regreso de las fichas de detalle. */
export function DetailBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}

/** Cabecera de las fichas de detalle, con el mismo resplandor celeste de la portada. */
export function DetailHero({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-unis-lightgray bg-white p-6 shadow-sm sm:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56"
        style={{ background: "radial-gradient(60% 70% at 50% 0%, rgba(22, 182, 214, 0.12), transparent)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Dato con icono (lugar, fecha, etc.) dentro de la cabecera. */
export function DetailFact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-unis-gray">
      <span className="text-unis-cyan [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
        {icon}
      </span>
      {children}
    </span>
  );
}

/** Título de sección con una barra de acento cian. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-bold text-unis-text">
      <span aria-hidden="true" className="h-5 w-1 rounded-full bg-unis-cyan" />
      {children}
    </h2>
  );
}

/** Tarjeta lateral de información. */
export function InfoCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm ${className}`}>
      {title ? <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-unis-text">{title}</h2> : null}
      {children}
    </section>
  );
}
