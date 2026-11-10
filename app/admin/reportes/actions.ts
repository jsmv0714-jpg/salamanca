"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import { notifyUsers } from "../../../lib/notifications";
import { UUID_RE, getString } from "../../../lib/validation";
import { removalReason } from "../../../lib/reports";

const REPORTS_PATH = "/admin/reportes";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || getUserRole(user) !== "admin") throw new Error("No autorizado");
  return user;
}

function readNote(formData: FormData): string | null {
  const note = getString(formData, "admin_note");
  return note ? note.slice(0, 500) : null;
}

function revalidateReports() {
  revalidatePath(REPORTS_PATH);
  revalidatePath("/cuenta");
}

/** Marca un reporte como resuelto sin tocar la publicación. */
export async function resolveReport(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect(REPORTS_PATH);

  const report = await prisma.publication_reports.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      reporter_id: true,
      publications: { select: { title: true, slug: true } },
    },
  });
  if (!report || report.status !== "open") redirect(`${REPORTS_PATH}?estado=open`);

  const note = readNote(formData);
  await prisma.publication_reports.update({
    where: { id: report.id },
    data: {
      status: "resolved",
      admin_note: note,
      reviewed_by_id: admin.id,
      reviewed_at: new Date(),
    },
  });

  if (report.reporter_id) {
    await notifyUsers([
      {
        userId: report.reporter_id,
        type: "report_resolved",
        title: "Reporte revisado",
        body: `Revisamos tu reporte sobre "${report.publications.title}".`,
        href: `/publicaciones/${report.publications.slug}`,
      },
    ]);
  }

  revalidateReports();
  redirect(`${REPORTS_PATH}?estado=open&ok=resuelto`);
}

/** Descarta un reporte: se revisó y no hay motivos para retirar la publicación. */
export async function dismissReport(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect(REPORTS_PATH);

  const report = await prisma.publication_reports.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      reporter_id: true,
      publications: { select: { title: true, slug: true } },
    },
  });
  if (!report || report.status !== "open") redirect(`${REPORTS_PATH}?estado=open`);

  const note = readNote(formData);
  await prisma.publication_reports.update({
    where: { id: report.id },
    data: {
      status: "dismissed",
      admin_note: note,
      reviewed_by_id: admin.id,
      reviewed_at: new Date(),
    },
  });

  if (report.reporter_id) {
    await notifyUsers([
      {
        userId: report.reporter_id,
        type: "report_resolved",
        title: "Reporte revisado",
        body: `Revisamos tu reporte sobre "${report.publications.title}" y no encontramos motivos para retirarla.`,
        href: `/publicaciones/${report.publications.slug}`,
      },
    ]);
  }

  revalidateReports();
  redirect(`${REPORTS_PATH}?estado=open&ok=descartado`);
}

/**
 * Retira la publicación reportada (pasa a rechazada), resuelve todos sus
 * reportes abiertos y avisa a quien publicó y a quienes reportaron.
 */
export async function unpublishFromReport(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect(REPORTS_PATH);

  const report = await prisma.publication_reports.findUnique({
    where: { id },
    select: {
      id: true,
      publication_id: true,
      status: true,
      publications: {
        select: {
          id: true,
          title: true,
          slug: true,
          user_id: true,
          reports: { where: { status: "open" }, select: { reporter_id: true } },
        },
      },
    },
  });
  if (!report) redirect(REPORTS_PATH);

  const note = readNote(formData);
  const reason = removalReason(note ?? "");
  const now = new Date();

  await prisma.$transaction([
    prisma.publications.update({
      where: { id: report.publication_id },
      data: { status: "rejected", rejection_reason: reason },
    }),
    prisma.publication_reports.updateMany({
      where: { publication_id: report.publication_id, status: "open" },
      data: {
        status: "resolved",
        admin_note: note,
        reviewed_by_id: admin.id,
        reviewed_at: now,
      },
    }),
  ]);

  const noteForOwner = note ? note.replace(/[.。]+$/, "") : "incumple las normas del Marketplace";
  await notifyUsers([
    {
      userId: report.publications.user_id,
      type: "publication_rejected",
      title: "Publicación retirada",
      body: `"${report.publications.title}" fue retirada tras un reporte de abuso: ${noteForOwner}.`,
      href: `/publicaciones/${report.publications.slug}`,
    },
  ]);

  const reporters = report.publications.reports
    .map((item) => item.reporter_id)
    .filter((reporterId): reporterId is string => Boolean(reporterId));

  if (reporters.length > 0) {
    await notifyUsers(
      reporters.map((userId) => ({
        userId,
        type: "report_resolved" as const,
        title: "Publicación retirada",
        body: `Atendimos tu reporte y retiramos "${report.publications.title}".`,
        href: "/publicaciones",
      }))
    );
  }

  revalidateReports();
  redirect(`${REPORTS_PATH}?estado=open&ok=oculta`);
}
