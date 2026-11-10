import { prisma } from "./prisma";

/**
 * Promociones y retiros del rol de administrador.
 *
 * Reglas:
 * - Solo un administrador puede cambiar el rol desde el panel.
 * - Nadie puede quitarse su propio rol (evita quedarse sin acceso por error).
 * - Siempre debe quedar al menos un administrador.
 * - Cada cambio se guarda en `role_changes` y se avisa por correo.
 */

export type RoleChangeFailure =
  | "not_found"
  | "already_admin"
  | "not_admin"
  | "self_demote"
  | "last_admin";

export type RoleChangeResult =
  | { ok: true; name: string; email: string; status: string }
  | { ok: false; code: RoleChangeFailure };

export const ROLE_CHANGE_MESSAGES: Record<RoleChangeFailure, string> = {
  not_found: "La cuenta no existe.",
  already_admin: "Esa cuenta ya es administradora.",
  not_admin: "Esa cuenta ya no es administradora.",
  self_demote: "No puedes quitarte tu propio rol de administrador. Pídeselo a otro administrador.",
  last_admin: "Debe quedar al menos un administrador. Promueve a otra persona antes de quitar este rol.",
};

/** Motivo por el que no se puede retirar el rol, o null si se puede. */
export function demotionBlocker(
  targetRole: string,
  isSelf: boolean,
  adminCount: number
): RoleChangeFailure | null {
  if (targetRole !== "admin") return "not_admin";
  if (isSelf) return "self_demote";
  if (adminCount <= 1) return "last_admin";
  return null;
}

/** El rol que tenía antes de ser administrador; si no hay historial, se usa `student`. */async function roleBeforeAdmin(userId: string): Promise<"student" | "company" | "teacher" | "association" | "entrepreneur"> {
  const previous = await prisma.role_changes.findFirst({
    where: { user_id: userId, to_role: "admin" },
    orderBy: { created_at: "desc" },
    select: { from_role: true },
  });
  if (previous && previous.from_role !== "admin") return previous.from_role;
  return "student";
}

export async function promoteToAdmin(targetId: string, actorId: string): Promise<RoleChangeResult> {
  const target = await prisma.users.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  if (!target) return { ok: false, code: "not_found" };
  if (target.role === "admin") return { ok: false, code: "already_admin" };

  await prisma.$transaction([
    prisma.users.update({ where: { id: target.id }, data: { role: "admin" } }),
    prisma.role_changes.create({
      data: { user_id: target.id, changed_by_id: actorId, from_role: target.role, to_role: "admin" },
    }),
  ]);

  return { ok: true, name: target.name, email: target.email, status: target.status };
}

export async function demoteAdmin(targetId: string, actorId: string): Promise<RoleChangeResult> {
  const target = await prisma.users.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  if (!target) return { ok: false, code: "not_found" };

  const admins = await prisma.users.count({ where: { role: "admin" } });
  const blocker = demotionBlocker(target.role, target.id === actorId, admins);
  if (blocker) return { ok: false, code: blocker };

  const restored = await roleBeforeAdmin(target.id);
  await prisma.$transaction([
    prisma.users.update({ where: { id: target.id }, data: { role: restored } }),
    prisma.role_changes.create({
      data: { user_id: target.id, changed_by_id: actorId, from_role: "admin", to_role: restored },
    }),
  ]);

  return { ok: true, name: target.name, email: target.email, status: target.status };
}
