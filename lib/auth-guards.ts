/**
 * Campos de `users` que el cliente nunca debe poder cambiar a través de
 * better-auth. `role` define permisos y `status` controla si la cuenta puede
 * escribir; ambos se gestionan solo desde el servidor o la base de datos.
 */
export const PROTECTED_USER_FIELDS = ["role", "status"] as const;

export type ProtectedUserField = (typeof PROTECTED_USER_FIELDS)[number];

/** Devuelve una copia de los datos sin los campos protegidos. */
export function stripProtectedUserFields<T extends Record<string, unknown>>(
  data: T
): Omit<T, ProtectedUserField> {
  const rest = { ...data };
  for (const field of PROTECTED_USER_FIELDS) {
    delete rest[field];
  }
  return rest;
}
