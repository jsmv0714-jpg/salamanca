import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";

/** Cantidad de avisos internos sin leer de la sesión actual. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ count: 0 }, { status: 401 });

  const count = await prisma.notifications.count({ where: { user_id: user.id, read_at: null } });
  return Response.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
