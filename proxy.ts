import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Primera barrera (optimista): solo revisa si existe la cookie de sesión.
 * La validación real de la sesión se hace en el servidor con requireUser().
 *
 * No redirigimos desde /login hacia /cuenta aquí a propósito: una cookie vencida
 * provocaría un bucle de redirecciones. Eso se resuelve en las propias páginas.
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(getSessionCookie(request));

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cuenta/:path*"],
};
