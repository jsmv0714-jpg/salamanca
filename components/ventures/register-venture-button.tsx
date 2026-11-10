import Link from "next/link";
import { getCurrentUser } from "../../lib/session";
import { getUserRole } from "../../lib/permissions";
import { allowedVentureTypes } from "../../lib/ventures";

/**
 * Botón "Registrar una venture" del listado. Visible para quien no ha iniciado
 * sesión (lo lleva a entrar) y para quien puede registrar ventures; oculto para el resto.
 */
export default async function RegisterVentureButton() {
  const user = await getCurrentUser();
  if (user && allowedVentureTypes(getUserRole(user)).length === 0) return null;

  return (
    <Link
      href="/ventures/nueva"
      className="rounded-xl bg-unis-cyan px-5 py-2.5 text-sm font-semibold text-unis-red-dark transition hover:bg-white"
    >
      Registrar una venture
    </Link>
  );
}
