"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import { UUID_RE, getString } from "../../../lib/validation";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || getUserRole(user) !== "admin") throw new Error("No autorizado");
  return user;
}

/** Aprueba una publicación: pasa a "publicada" y entra al listado público. */
export async function approvePublication(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect("/admin/publicaciones");

  const publication = await prisma.publications.findUnique({ where: { id }, select: { published_at: true } });
  if (publication) {
    await prisma.publications.update({
      where: { id },
      data: {
        status: "published",
        rejection_reason: null,
        published_at: publication.published_at ?? new Date(),
      },
    });
  }
  redirect("/admin/publicaciones?ok=aprobada");
}

/** Rechaza (o baja) una publicación con un motivo para que quien la creó sepa qué corregir. */
export async function rejectPublication(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect("/admin/publicaciones");

  const reason = getString(formData, "reason");
  if (reason.length < 5 || reason.length > 500) redirect("/admin/publicaciones?error=motivo");

  await prisma.publications.updateMany({
    where: { id },
    data: { status: "rejected", rejection_reason: reason },
  });
  redirect("/admin/publicaciones?ok=rechazada");
}
