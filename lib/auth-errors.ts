/** Mensaje para mostrar un error de better-auth en el formulario, en español. */
export function authErrorMessage(
  error: { status?: number; message?: string } | null | undefined,
  fallback: string
): string {
  if (error?.status === 429) return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  // Al registrarse, el servidor avisa si el correo ya existe. Se responde igual que a cualquier
  // otro fallo para no permitir averiguar qué personas tienen cuenta.
  if (error?.message && /already exists|ya existe/i.test(error.message)) {
    return "No pudimos crear la cuenta con este correo. Si ya tienes una, inicia sesión o recupera tu contraseña.";
  }
  return error?.message || fallback;
}
