"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";
import { getUserStatus } from "../../../../lib/permissions";
import { getString } from "../../../../lib/validation";
import { notifyAdmins } from "../../../../lib/notifications";
import { REPORT_REASON_LABELS, isReportReason, reportDetailsError } from "../../../../lib/reports";

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

/**
 * Registra un reporte de abuso sobre una publicación. Cualquier persona con
 * sesión activa puede reportar, salvo quien publicó. Un mismo usuario solo
 * puede reportar una vez cada publicación.
 */
export async function reportPublication(slug: string, formData: FormData): Promise<void> {
  const base = `/publicaciones/${slug}/reportar`;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(base)}`);
  if (getUserStatus(user) !== "active") redirect(`${base}?error=cuenta`);

  const publication = await prisma.publications.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true, status: true, user_id: true },
  });
  if (!publication || publication.user_id === user.id) redirect(`/publicaciones/${slug}`);
  if (publication.status !== "published" && publication.status !== "closed") {
    redirect(`/publicaciones/${slug}`);
  }

  const reason = getString(formData, "reason");
  if (!isReportReason(reason)) redirect(`${base}?error=motivo`);

  const details = getString(formData, "details");
  if (reportDetailsError(details)) redirect(`${base}?error=detalles`);

  const existing = await prisma.publication_reports.findUnique({
    where: { publication_id_reporter_id: { publication_id: publication.id, reporter_id: user.id } },
    select: { id: true },
  });
  if (existing) redirect(`${base}?reporte=duplicado`);

  try {
    await prisma.publication_reports.create({
      data: {
        publication_id: publication.id,
        reporter_id: user.id,
        reason,
        details: details || null,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) redirect(`${base}?reporte=duplicado`);
    console.error("No se pudo registrar el reporte:", error);
    redirect(`${base}?error=guardar`);
  }

  await notifyAdmins({
    type: "report_created",
    title: "Nuevo reporte de publicación",
    body: `${user.name || user.email} reportó "${publication.title}": ${REPORT_REASON_LABELS[reason]}.`,
    href: "/admin/reportes?estado=open",
  });

  revalidatePath("/admin/reportes");
  redirect(`${base}?reporte=enviado`);
}
