"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";
import { getUserRole } from "../../../../lib/permissions";
import { notifyUsers } from "../../../../lib/notifications";
import { UUID_RE, getString } from "../../../../lib/validation";
import { removalReason } from "../../../../lib/reports";

const PATH = "/admin/reportes/ventures";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || getUserRole(user) !== "admin") throw new Error("No autorizado");
  return user;
}

function readNote(formData: FormData): string | null {
  const note = getString(formData, "admin_note");
  return note ? note.slice(0, 500) : null;
}

function revalidate() {
  revalidatePath(PATH);
  revalidatePath("/admin/reportes");
}

async function loadOpenReport(id: string) {
  return prisma.venture_reports.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      reporter_id: true,
      venture_id: true,
      ventures: { select: { name: true, slug: true, user_id: true } },
    },
  });
}

/** Marca la denuncia como resuelta sin tocar la venture. */
export async function resolveVentureReport(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect(PATH);

  const report = await loadOpenReport(id);
  if (!report || report.status !== "open") redirect(`${PATH}?estado=open`);

  await prisma.venture_reports.update({
    where: { id: report.id },
    data: { status: "resolved", admin_note: readNote(formData), reviewed_by_id: admin.id, reviewed_at: new Date() },
  });
  if (report.reporter_id) {
    await notifyUsers([
      {
        userId: report.reporter_id,
        type: "report_resolved",
        title: "Denuncia revisada",
        body: `Revisamos tu denuncia sobre "${report.ventures.name}".`,
        href: `/ventures/${report.ventures.slug}`,
      },
    ]);
  }
  revalidate();
  redirect(`${PATH}?estado=open&ok=resuelto`);
}

/** Descarta la denuncia: no hay motivos para retirar la venture. */
export async function dismissVentureReport(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect(PATH);

  const report = await loadOpenReport(id);
  if (!report || report.status !== "open") redirect(`${PATH}?estado=open`);

  await prisma.venture_reports.update({
    where: { id: report.id },
    data: { status: "dismissed", admin_note: readNote(formData), reviewed_by_id: admin.id, reviewed_at: new Date() },
  });
  if (report.reporter_id) {
    await notifyUsers([
      {
        userId: report.reporter_id,
        type: "report_resolved",
        title: "Denuncia revisada",
        body: `Revisamos tu denuncia sobre "${report.ventures.name}" y no encontramos motivos para retirarla.`,
        href: `/ventures/${report.ventures.slug}`,
      },
    ]);
  }
  revalidate();
  redirect(`${PATH}?estado=open&ok=descartado`);
}

/** Retira la venture (pasa a rechazada), resuelve sus denuncias abiertas y avisa a su autor. */
export async function retireVentureFromReport(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect(PATH);

  const report = await loadOpenReport(id);
  if (!report) redirect(PATH);

  const note = readNote(formData);
  const now = new Date();
  const openReporters = await prisma.venture_reports.findMany({
    where: { venture_id: report.venture_id, status: "open" },
    select: { reporter_id: true },
  });

  await prisma.$transaction([
    prisma.ventures.update({
      where: { id: report.venture_id },
      data: { status: "rejected", rejection_reason: removalReason(note ?? "") },
    }),
    prisma.venture_reports.updateMany({
      where: { venture_id: report.venture_id, status: "open" },
      data: { status: "resolved", admin_note: note, reviewed_by_id: admin.id, reviewed_at: now },
    }),
  ]);

  const owner = await prisma.ventures.findUnique({ where: { id: report.venture_id }, select: { user_id: true } });
  if (owner) {
    await notifyUsers([
      {
        userId: owner.user_id,
        type: "publication_rejected",
        title: "Venture retirada",
        body: `"${report.ventures.name}" fue retirada tras una denuncia de abuso${note ? `: ${note}` : "."}`,
        href: `/ventures/${report.ventures.slug}`,
      },
    ]);
  }

  const reporters = openReporters.map((r) => r.reporter_id).filter((rid): rid is string => Boolean(rid));
  if (reporters.length > 0) {
    await notifyUsers(
      reporters.map((userId) => ({
        userId,
        type: "report_resolved" as const,
        title: "Venture retirada",
        body: `Atendimos tu denuncia y retiramos "${report.ventures.name}".`,
        href: "/ventures",
      }))
    );
  }

  revalidate();
  redirect(`${PATH}?estado=open&ok=retirada`);
}
