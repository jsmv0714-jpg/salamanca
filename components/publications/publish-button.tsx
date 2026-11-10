import Link from "next/link";
import { getCurrentUser } from "../../lib/session";
import { getUserRole } from "../../lib/permissions";
import { isAuthorRole } from "../../lib/publications";

/**
 * Botón "Publicar" del listado. Visible para quien no ha iniciado sesión (lo
 * lleva a entrar) y para quien puede publicar; oculto para el resto.
 */
export default async function PublishButton() {
  const user = await getCurrentUser();
  if (user && !isAuthorRole(getUserRole(user))) return null;

  return (
    <Link
      href="/publicaciones/nueva"
      className="rounded-xl bg-unis-cyan px-5 py-2.5 text-sm font-semibold text-unis-red-dark transition hover:bg-white"
    >
      Publicar
    </Link>
  );
}
