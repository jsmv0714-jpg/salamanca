"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";
import { getUserRole } from "../../../../lib/permissions";
import { notifyUsers } from "../../../../lib/notifications";
import { UUID_RE, getString } from "../../../../lib/validation";

const PATH = "/admin/reportes/directorio";

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
  revalidatePath("/directorio");
}

async function loadReport(id: string) {
  return prisma.directory_reports.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      reporter_id: true,
      directory_profile_id: true,
      directory_profiles: {
        select: {
          display_name: true,
          user_id: true,
          users: { select: { name: true, email: true } },
        },
      },
    },
  });
}

function profileLabel(report: NonNullable<Awaited<ReturnType<typeof loadReport>>>): string {
  return report.directory_profiles.display_name || report.directory_profiles.users.name || "un miembro del directorio";
}

/** Marca la denuncia como resuelta sin tocar el perfil. */
export async function resolveDirectoryReport(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect(PATH);

  const report = await loadReport(id);
  if (!report || report.status !== "open") redirect(`${PATH}?estado=open`);

  await prisma.directory_reports.update({
    where: { id: report.id },
    data: { status: "resolved", admin_note: readNote(formData), reviewed_by_id: admin.id, reviewed_at: new Date() },
  });
  if (report.reporter_id) {
    await notifyUsers([
      {
        userId: report.reporter_id,
        type: "report_resolved",
        title: "Denuncia revisada",
        body: `Revisamos tu denuncia sobre "${profileLabel(report)}".`,
        href: `/directorio?ver=${report.directory_profile_id}`,
      },
    ]);
  }
  revalidate();
  redirect(`${PATH}?estado=open&ok=resuelto`);
}

/** Descarta la denuncia: no hay motivos para ocultar el perfil. */
export async function dismissDirectoryReport(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect(PATH);

  const report = await loadReport(id);
  if (!report || report.status !== "open") redirect(`${PATH}?estado=open`);

  await prisma.directory_reports.update({
    where: { id: report.id },
    data: { status: "dismissed", admin_note: readNote(formData), reviewed_by_id: admin.id, reviewed_at: new Date() },
  });
  if (report.reporter_id) {
    await notifyUsers([
      {
        userId: report.reporter_id,
        type: "report_resolved",
        title: "Denuncia revisada",
        body: `Revisamos tu denuncia sobre "${profileLabel(report)}" y no encontramos motivos para retirar el perfil.`,
        href: `/directorio?ver=${report.directory_profile_id}`,
      },
    ]);
  }
  revalidate();
  redirect(`${PATH}?estado=open&ok=descartado`);
}

/** Oculta el perfil del directorio, resuelve sus denuncias abiertas y avisa a su dueño y a quienes denunciaron. */
export async function hideDirectoryProfileFromReport(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect(PATH);

  const report = await loadReport(id);
  if (!report) redirect(PATH);

  const note = readNote(formData);
  const now = new Date();
  const openReporters = await prisma.directory_reports.findMany({
    where: { directory_profile_id: report.directory_profile_id, status: "open" },
    select: { reporter_id: true },
  });

  await prisma.$transaction([
    prisma.directory_profiles.update({
      where: { id: report.directory_profile_id },
      data: { is_visible: false },
    }),
    prisma.directory_reports.updateMany({
      where: { directory_profile_id: report.directory_profile_id, status: "open" },
      data: { status: "resolved", admin_note: note, reviewed_by_id: admin.id, reviewed_at: now },
    }),
  ]);

  const label = profileLabel(report);
  await notifyUsers([
    {
      userId: report.directory_profiles.user_id,
      type: "report_resolved",
      title: "Perfil retirado del directorio",
      body: `"${label}" fue ocultado del directorio tras una denuncia${note ? `: ${note}` : "."}`,
      href: "/cuenta/directorio",
    },
  ]);

  const reporters = openReporters.map((r) => r.reporter_id).filter((userId): userId is string => Boolean(userId));
  if (reporters.length > 0) {
    await notifyUsers(
      reporters.map((userId) => ({
        userId,
        type: "report_resolved" as const,
        title: "Perfil retirado del directorio",
        body: `Atendimos tu denuncia y ocultamos "${label}" del directorio.`,
        href: "/directorio",
      }))
    );
  }

  revalidate();
  redirect(`${PATH}?estado=open&ok=oculto`);
}
