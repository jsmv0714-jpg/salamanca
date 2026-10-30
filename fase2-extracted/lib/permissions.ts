import { notFound } from "next/navigation";
import { requireUser } from "./session";

/** Lee el rol de la sesión (better-auth lo expone como campo adicional). */
export function getUserRole(user: object | null | undefined): string {
  return (user as { role?: string } | null | undefined)?.role ?? "";
}

export function getUserStatus(user: object | null | undefined): string {
  return (user as { status?: string } | null | undefined)?.status ?? "pending";
}

/** Exige sesión de administrador. Para cualquier otra persona la ruta "no existe". */
export async function requireAdmin(returnTo: string) {
  const user = await requireUser(returnTo);
  if (getUserRole(user) !== "admin") notFound();
  return user;
}
