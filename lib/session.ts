import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Capa de acceso a la sesión (solo servidor).
 * Con `cacheComponents` activo, quien llame estas funciones debe estar dentro de <Suspense>.
 *
 * `cache()` evita repetir la validación de la sesión cuando varios componentes
 * del mismo render (página, botón de publicar, campana, etc.) piden al usuario.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

/** Exige sesión: si no hay, redirige a /login conservando la ruta de destino. */
export async function requireUser(returnTo?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const query = returnTo ? `?redirect=${encodeURIComponent(returnTo)}` : "";
    redirect(`/login${query}`);
  }
  return user;
}
