import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Capa de acceso a la sesión (solo servidor).
 * Con `cacheComponents` activo, quien llame estas funciones debe estar dentro de <Suspense>.
 */
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** Exige sesión: si no hay, redirige a /login conservando la ruta de destino. */
export async function requireUser(returnTo?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const query = returnTo ? `?redirect=${encodeURIComponent(returnTo)}` : "";
    redirect(`/login${query}`);
  }
  return user;
}
