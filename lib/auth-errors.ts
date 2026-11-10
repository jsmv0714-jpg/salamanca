/** Mensaje para mostrar un error de better-auth en el formulario, en español. */
export function authErrorMessage(
  error: { status?: number; message?: string } | null | undefined,
  fallback: string
): string {
  if (error?.status === 429) return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  return error?.message || fallback;
}
