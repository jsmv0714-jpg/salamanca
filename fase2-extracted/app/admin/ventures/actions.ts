"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import { UUID_RE, getString } from "../../../lib/validation";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || getUserRole(user) !== "admin") {
    throw new Error("No autorizado");
  }
  return user;
}

/** Aprueba una venture: pasa a "publicada" y entra al listado público. */
export async function approveVenture(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect("/admin/ventures");

  const venture = await prisma.ventures.findUnique({ where: { id }, select: { published_at: true } });
  if (venture) {
    await prisma.ventures.update({
      where: { id },
      data: {
        status: "published",
        rejection_reason: null,
        published_at: venture.published_at ?? new Date(),
      },
    });
  }
  redirect("/admin/ventures?ok=aprobada");
}

/** Rechaza una venture con un motivo, para que su dueño sepa qué corregir. */
export async function rejectVenture(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect("/admin/ventures");

  const reason = getString(formData, "reason");
  if (reason.length < 5 || reason.length > 500) {
    redirect("/admin/ventures?error=motivo");
  }

  await prisma.ventures.updateMany({
    where: { id },
    data: { status: "rejected", rejection_reason: reason },
  });
  redirect("/admin/ventures?ok=rechazada");
}
