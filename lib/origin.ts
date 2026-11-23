import { appUrl } from "./email";

/**
 * Protección CSRF para rutas de API que cambian datos usando la sesión por cookie.
 * El navegador envía `Origin` en las peticiones POST y DELETE; si no coincide con
 * nuestra app, la petición viene de otro sitio y se rechaza.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowed = new Set<string>([new URL(request.url).origin]);
  try {
    allowed.add(new URL(appUrl()).origin);
  } catch {
    // Sin URL configurada solo vale el origen de la propia petición.
  }
  return allowed.has(origin);
}
