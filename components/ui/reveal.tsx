import type { CSSProperties, ReactNode } from "react";

/** Contenedor que aparece subiendo suavemente, después de `delay` milisegundos. */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={`reveal-fade ${className}`} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
