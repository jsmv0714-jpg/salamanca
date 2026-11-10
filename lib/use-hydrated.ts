"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Indica si el componente ya se hidrató en el navegador.
 *
 * Sirve para no dejar formularios sensibles (contraseñas) utilizables antes de que
 * React escuche el envío: un envío nativo los mandaría por GET, con la contraseña
 * en la URL y en los registros del servidor.
 */
export function useHydrated(): boolean {
  // En el servidor (y en la primera pasada del cliente) devuelve false; luego, true.
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
