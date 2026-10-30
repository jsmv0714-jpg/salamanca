"use client";

import { secondaryButtonClass } from "../ui/form";

/** Botón de borrado con confirmación del navegador. Va dentro de un <form action={...}>. */
export default function DeleteVentureButton() {
  return (
    <button
      type="submit"
      className={`${secondaryButtonClass} hover:bg-red-50`}
      onClick={(event) => {
        if (!window.confirm("¿Eliminar esta venture? Esta acción no se puede deshacer.")) {
          event.preventDefault();
        }
      }}
    >
      Eliminar venture
    </button>
  );
}
