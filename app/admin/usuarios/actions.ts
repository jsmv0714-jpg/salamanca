"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import { isUserStatus } from "../../../lib/admin";
import { UUID_RE, getString } from "../../../lib/validation";

/** Activa, suspende o deja pendiente una cuenta. No permite tocar la propia ni las de otros administradores. */
export async function setUserStatus(formData: FormData): Promise<void> {
  const admin = await getCurrentUser();
  if (!admin || getUserRole(admin) !== "admin") throw new Error("No autorizado");

  const id = getString(formData, "id");
  const status = getString(formData, "status");
  const back = getString(formData, "back");
  const returnTo = back.startsWith("/admin/usuarios") ? back : "/admin/usuarios";

  if (UUID_RE.test(id) && isUserStatus(status) && id !== admin.id) {
    await prisma.users.updateMany({
      where: { id, role: { not: "admin" } },
      data: { status },
    });
  }
  redirect(returnTo);
}
