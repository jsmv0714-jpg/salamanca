import type { ReactNode } from "react";
import TechBackground from "./tech-background";

/** Fondo azul oscuro con la animación detrás del contenido, para las páginas de acceso. */
export default function AuthBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden bg-unis-red">
      <TechBackground />
      <div className="relative">{children}</div>
    </div>
  );
}
