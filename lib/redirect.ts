/**
 * Devuelve una ruta interna segura para redirigir después de login/registro.
 * Evita "open redirects": solo acepta rutas que empiecen con "/" (una sola barra).
 */
export function getSafeRedirect(value: string | null | undefined, fallback = "/cuenta"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
