"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/session";
import { getUserStatus } from "../../lib/permissions";
import { getSafeRedirect } from "../../lib/redirect";
import { notifyAdmins } from "../../lib/notifications";
import { REPORT_REASON_LABELS, isReportReason, reportDetailsError } from "../../lib/reports";
import { UUID_RE, getString, type FormState } from "../../lib/validation";

type Kind = "publication" | "venture" | "directory";

function readKind(formData: FormData): Kind | null {
  const kind = getString(formData, "kind");
  return kind === "publication" || kind === "venture" || kind === "directory" ? kind : null;
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

/** "Me gusta": guarda la publicación, venture o perfil del directorio en la sección Guardados de la cuenta. */
export async function toggleSaved(formData: FormData): Promise<void> {
  await toggleMark(formData, "saved");
}

/** Ocultar: deja de aparecer en los listados para esta persona. Se puede volver a mostrar. */
export async function toggleHidden(formData: FormData): Promise<void> {
  await toggleMark(formData, "hidden");
}

async function toggleMark(formData: FormData, field: "saved" | "hidden") {
  const next = getSafeRedirect(getString(formData, "next"), "/publicaciones");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(next)}`);

  const kind = readKind(formData);
  const id = getString(formData, "id");
  if (!kind || !UUID_RE.test(id)) redirect(next);

  if (kind === "publication") {
    const target = await prisma.publications.findFirst({
      where: { id, status: { in: ["published", "closed"] } },
      select: { id: true },
    });
    if (!target) redirect(next);

    const key = { user_id_publication_id: { user_id: user.id, publication_id: id } };
    const current = await prisma.publication_marks.findUnique({ where: key, select: { saved: true, hidden: true } });
    const value = !(current?.[field] ?? false);
    await prisma.publication_marks.upsert({
      where: key,
      create: { user_id: user.id, publication_id: id, [field]: value },
      update: { [field]: value },
    });
  } else if (kind === "venture") {
    const target = await prisma.ventures.findFirst({ where: { id, status: "published" }, select: { id: true } });
    if (!target) redirect(next);

    const key = { user_id_venture_id: { user_id: user.id, venture_id: id } };
    const current = await prisma.venture_marks.findUnique({ where: key, select: { saved: true, hidden: true } });
    const value = !(current?.[field] ?? false);
    await prisma.venture_marks.upsert({
      where: key,
      create: { user_id: user.id, venture_id: id, [field]: value },
      update: { [field]: value },
    });
  } else {
    const target = await prisma.directory_profiles.findFirst({
      where: { id, is_visible: true, users: { status: "active" } },
      select: { id: true },
    });
    if (!target) redirect(next);

    const key = { user_id_directory_profile_id: { user_id: user.id, directory_profile_id: id } };
    const current = await prisma.directory_marks.findUnique({ where: key, select: { saved: true, hidden: true } });
    const value = !(current?.[field] ?? false);
    await prisma.directory_marks.upsert({
      where: key,
      create: { user_id: user.id, directory_profile_id: id, [field]: value },
      update: { [field]: value },
    });
  }

  redirect(next);
}

/**
 * Denuncia una publicación, venture o perfil del directorio. El motivo y la justificación son obligatorios:
 * el administrador necesita saber por qué se denuncia.
 */
export async function reportItem(kind: Kind, id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Inicia sesión para denunciar." };
  if (getUserStatus(user) !== "active") return { error: "Tu cuenta debe estar activa para denunciar." };
  if (!UUID_RE.test(id)) return { error: "No encontramos lo que quieres denunciar." };

  const reason = getString(formData, "reason");
  const details = getString(formData, "details");
  const values = { reason, details };

  const fieldErrors: Record<string, string> = {};
  if (!isReportReason(reason)) fieldErrors.reason = "Elige un motivo de la lista.";
  const detailsProblem = reportDetailsError(details);
  if (detailsProblem) fieldErrors.details = detailsProblem;
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Revisa los campos marcados.", fieldErrors, values };
  }
  if (!isReportReason(reason)) return { error: "Revisa los campos marcados.", values };

  try {
    if (kind === "publication") {
      const target = await prisma.publications.findFirst({
        where: { id, status: { in: ["published", "closed"] } },
        select: { id: true, title: true, slug: true, user_id: true },
      });
      if (!target) return { error: "Esta publicación ya no está disponible." };
      if (target.user_id === user.id) return { error: "No puedes denunciar tu propia publicación." };

      await prisma.publication_reports.create({
        data: { publication_id: target.id, reporter_id: user.id, reason, details },
      });
      await notifyAdmins({
        type: "report_created",
        title: "Nueva denuncia de publicación",
        body: `${user.name || user.email} denunció "${target.title}": ${REPORT_REASON_LABELS[reason]}.`,
        href: "/admin/reportes?estado=open",
      });
    } else if (kind === "venture") {
      const target = await prisma.ventures.findFirst({
        where: { id, status: "published" },
        select: { id: true, name: true, user_id: true },
      });
      if (!target) return { error: "Esta venture ya no está disponible." };
      if (target.user_id === user.id) return { error: "No puedes denunciar tu propia venture." };

      await prisma.venture_reports.create({
        data: { venture_id: target.id, reporter_id: user.id, reason, details },
      });
      await notifyAdmins({
        type: "report_created",
        title: "Nueva denuncia de venture",
        body: `${user.name || user.email} denunció "${target.name}": ${REPORT_REASON_LABELS[reason]}.`,
        href: "/admin/reportes?estado=open&tipo=ventures",
      });
    } else {
      const target = await prisma.directory_profiles.findFirst({
        where: { id, is_visible: true, users: { status: "active" } },
        select: { id: true, display_name: true, user_id: true, users: { select: { name: true } } },
      });
      if (!target) return { error: "Este perfil ya no está disponible." };
      if (target.user_id === user.id) return { error: "No puedes denunciar tu propio perfil." };

      await prisma.directory_reports.create({
        data: { directory_profile_id: target.id, reporter_id: user.id, reason, details },
      });
      const label = target.display_name || target.users.name || "un miembro del directorio";
      await notifyAdmins({
        type: "report_created",
        title: "Nueva denuncia del directorio",
        body: `${user.name || user.email} denunció el perfil de "${label}": ${REPORT_REASON_LABELS[reason]}.`,
        href: "/admin/reportes/directorio?estado=open",
      });
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Ya enviaste una denuncia sobre esto. Un administrador la revisará." };
    console.error("No se pudo registrar la denuncia:", error);
    return { error: "No pudimos enviar la denuncia. Intenta de nuevo." };
  }

  return { values: { sent: "1" } };
}
