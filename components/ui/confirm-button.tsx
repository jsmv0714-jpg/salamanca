"use client";

import type { ReactNode } from "react";

/** Botón de envío que pide confirmación al navegador antes de ejecutar la acción del formulario. */
export default function ConfirmButton({
  message,
  className,
  formAction,
  children,
}: {
  message: string;
  className?: string;
  /** Acción del formulario cuando hay varios botones con acciones distintas. */
  formAction?: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      formAction={formAction}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
