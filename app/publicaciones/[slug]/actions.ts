"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { getUserRole, getUserStatus } from "../../../lib/permissions";
import { isPastDeadline } from "../../../lib/dates";
import { readCvFile, type CvReadResult } from "../../../lib/cv-file";
import { appUrl, sendEmail } from "../../../lib/email";
import { notifyUsers } from "../../../lib/notifications";
import {
  UUID_RE,
  getString,
  isHttpUrl,
  normalizeUrl,
  type FormState,
} from "../../../lib/validation";
import {
  REVIEWER_APPLICATION_STATUSES,
  canApplyToType,
  isApplicationStatus,
  whoCanApply,
} from "../../../lib/publications";

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

type ApplicationContent = {
  message: string;
  portfolio_url: string | null;
  linkedin_url: string | null;
  phone: string | null;
  data_consent: boolean;
  consent_at: Date;
};

type CvFileData = { filename: string; mime_type: string; size_bytes: number; data: Buffer };

/**
 * Vuelve a enviar una postulación retirada, solo si aún no la reenvió antes.
 * Devuelve false si no hay una retirada que pueda reenviarse.
 */
async function reapplyAfterWithdrawal(
  publicationId: string,
  applicantId: string,
  content: ApplicationContent,
  cvFile: CvFileData | null
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.applications.updateMany({
      where: { publication_id: publicationId, applicant_id: applicantId, status: "withdrawn", reapplied_at: null },
      data: { ...content, status: "sent", created_at: new Date(), reapplied_at: new Date() },
    });
    if (count === 0) return false;

    if (cvFile) {
      const application = await tx.applications.findUniqueOrThrow({
        where: { publication_id_applicant_id: { publication_id: publicationId, applicant_id: applicantId } },
        select: { id: true },
      });
      await tx.application_files.create({ data: { application_id: application.id, ...cvFile } });
    }
    return true;
  });
}

/** Envía una postulación (o solicitud de interés) a una publicación. */
export async function applyToPublication(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/publicaciones/${slug}`)}`);

  const role = getUserRole(user);
  if (getUserStatus(user) !== "active") {
    return { error: "Tu cuenta debe estar activa para postularte. Un administrador debe activarla." };
  }

  const publication = await prisma.publications.findUnique({
    where: { slug },
    select: {
      id: true,
      user_id: true,
      status: true,
      deadline: true,
      title: true,
      publication_types: { select: { code: true } },
      users: { select: { email: true } },
    },
  });
  if (!publication || publication.status !== "published") {
    return { error: "Esta publicación ya no recibe postulaciones." };
  }
  if (isPastDeadline(publication.deadline)) return { error: "El plazo de esta publicación terminó." };
  if (publication.user_id === user.id) return { error: "No puedes postularte a tu propia publicación." };

  const typeCode = publication.publication_types.code;
  if (!canApplyToType(typeCode, role)) return { error: whoCanApply(typeCode) };

  const isInternship = typeCode === "internship";
  const values: Record<string, string | string[]> = {
    message: getString(formData, "message"),
    portfolio_url: getString(formData, "portfolio_url"),
    linkedin_url: isInternship ? getString(formData, "linkedin_url") : "",
    phone: getString(formData, "phone"),
    data_consent: formData.get("data_consent") === "on" ? "on" : "",
  };
  const errors: Record<string, string> = {};

  const message = values.message as string;
  if (message.length < 20 || message.length > 2000) {
    errors.message = "Escribe un mensaje de entre 20 y 2000 caracteres.";
  }

  const urls = {
    portfolio_url: normalizeUrl(values.portfolio_url as string),
    linkedin_url: normalizeUrl(values.linkedin_url as string),
  };
  for (const key of ["portfolio_url", "linkedin_url"] as const) {
    if (urls[key] && (!isHttpUrl(urls[key]) || urls[key].length > 500)) {
      errors[key] = "Escribe un enlace válido que empiece por http:// o https://.";
    }
  }

  // Las prácticas exigen la hoja de vida como archivo (PDF o Word).
  let cv: Extract<CvReadResult, { ok: true }> | null = null;
  if (isInternship) {
    const upload = formData.get("cv_file");
    if (!(upload instanceof File) || upload.size === 0) {
      errors.cv_file = "Adjunta tu hoja de vida en PDF o Word.";
    } else {
      const result = await readCvFile(upload);
      if (result.ok) cv = result;
      else errors.cv_file = result.error;
    }
  }

  const phone = values.phone as string;
  if (phone.length > 50) errors.phone = "Máximo 50 caracteres.";

  if (!values.data_consent) errors.data_consent = "Debes autorizar el uso de tus datos para enviar la solicitud.";

  if (Object.keys(errors).length > 0) {
    return { error: "Revisa los campos marcados.", fieldErrors: errors, values };
  }

  const content: ApplicationContent = {
    message,
    portfolio_url: urls.portfolio_url || null,
    linkedin_url: urls.linkedin_url || null,
    phone: phone || null,
    data_consent: true,
    consent_at: new Date(),
  };
  const cvFile: CvFileData | null = cv
    ? {
        filename: cv.filename,
        mime_type: cv.mimeType,
        size_bytes: cv.size,
        // Prisma tipa las columnas Bytes como Buffer.
        data: Buffer.from(cv.data),
      }
    : null;

  try {
    await prisma.applications.create({
      data: {
        publication_id: publication.id,
        applicant_id: user.id,
        ...content,
        ...(cvFile ? { application_files: { create: cvFile } } : {}),
      },
    });
  } catch (error) {
    if (!isUniqueViolation(error)) return { error: "No se pudo enviar tu solicitud. Intenta de nuevo.", values };
    let reapplied: boolean;
    try {
      reapplied = await reapplyAfterWithdrawal(publication.id, user.id, content, cvFile);
    } catch {
      return { error: "No se pudo enviar tu solicitud. Intenta de nuevo.", values };
    }
    if (!reapplied) return { error: "Ya enviaste una solicitud a esta publicación." };
  }

  // Aviso al autor de la publicación. Un fallo de correo no invalida la postulación.
  await notifyUsers([
    {
      userId: publication.user_id,
      type: "application_received",
      title: "Nueva postulación",
      body: `${user.name || user.email} envió una solicitud a "${publication.title}".`,
      href: `/publicaciones/${slug}/postulaciones`,
    },
  ]);

  await sendEmail({
    to: publication.users.email,
    subject: `Nueva postulación: ${publication.title}`,
    text: [
      `${user.name || user.email} envió una postulación a "${publication.title}".`,
      "",
      `Revísala aquí: ${appUrl()}/publicaciones/${slug}/postulaciones`,
    ].join("\n"),
  }).catch((error) => {
    console.error("No se pudo notificar al autor de la publicación:", error);
  });

  redirect("/cuenta/postulaciones?enviada=1");
}

/** Quien aplicó retira su postulación mientras no haya sido decidida (y se borra su hoja de vida). */
export async function withdrawApplication(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/cuenta/postulaciones");

  const id = getString(formData, "id");
  if (UUID_RE.test(id)) {
    const application = await prisma.applications.findFirst({
      where: { id, applicant_id: user.id, status: { in: ["sent", "viewed", "shortlisted"] } },
      select: { id: true },
    });
    if (application) {
      // Al retirarse, también se borra la hoja de vida adjunta.
      await prisma.$transaction([
        prisma.application_files.deleteMany({ where: { application_id: application.id } }),
        prisma.applications.update({ where: { id: application.id }, data: { status: "withdrawn" } }),
      ]);
    }
  }
  redirect("/cuenta/postulaciones");
}

/** Quien publicó (o un administrador) cambia el estado de una postulación recibida. */
export async function updateApplicationStatus(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = getString(formData, "id");
  const status = getString(formData, "status");
  if (!UUID_RE.test(id) || !isApplicationStatus(status) || !(REVIEWER_APPLICATION_STATUSES as readonly string[]).includes(status)) {
    redirect("/cuenta/publicaciones");
  }

  const application = await prisma.applications.findUnique({
    where: { id },
    select: {
      status: true,
      applicant_id: true,
      users: { select: { email: true, name: true } },
      publications: { select: { slug: true, user_id: true, title: true } },
    },
  });
  if (!application) redirect("/cuenta/publicaciones");

  const isOwner = application.publications.user_id === user.id;
  if (!isOwner && getUserRole(user) !== "admin") redirect("/cuenta/publicaciones");

  // Una postulación retirada ya no se puede cambiar.
  if (application.status !== "withdrawn") {
    const changed = application.status !== status;
    await prisma.applications.update({ where: { id }, data: { status } });

    // Solo se avisa de las decisiones finales y cuando el estado cambió.
    if (changed && (status === "accepted" || status === "rejected")) {
      await notifyUsers([
        {
          userId: application.applicant_id,
          type: status === "accepted" ? "application_accepted" : "application_rejected",
          title: status === "accepted" ? "Postulación aceptada" : "Postulación rechazada",
          body: `Tu postulación a "${application.publications.title}" fue ${
            status === "accepted" ? "aceptada" : "rechazada"
          }.`,
          href: "/cuenta/postulaciones",
        },
      ]);

      await sendEmail({
        to: application.users.email,
        subject: `Tu postulación a "${application.publications.title}" fue ${
          status === "accepted" ? "aceptada" : "rechazada"
        }`,
        text: [
          `Hola${application.users.name ? ` ${application.users.name}` : ""},`,
          "",
          `Tu postulación a "${application.publications.title}" fue ${
            status === "accepted" ? "aceptada" : "rechazada"
          }.`,
          "",
          `Puedes ver el detalle en ${appUrl()}/cuenta/postulaciones`,
        ].join("\n"),
      }).catch((error) => {
        console.error("No se pudo notificar al postulante:", error);
      });
    }
  }
  redirect(`/publicaciones/${application.publications.slug}/postulaciones`);
}
