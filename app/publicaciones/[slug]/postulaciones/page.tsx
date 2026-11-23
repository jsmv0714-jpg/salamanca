import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/session";
import { getUserRole } from "../../../../lib/permissions";
import { formatDate } from "../../../../lib/dates";
import { formatBytes } from "../../../../lib/cv-file";
import { safeHttpUrl } from "../../../../lib/profile";
import {
  APPLICATION_STATUS_LABELS,
  REVIEWER_APPLICATION_STATUSES,
  isApplicationStatus,
} from "../../../../lib/publications";
import { inputClass, secondaryButtonClass } from "../../../../components/ui/form";
import Callout from "../../../../components/ui/callout";
import { ApplicationStatusBadge } from "../../../../components/publications/status-badges";
import { updateApplicationStatus } from "../actions";

export default function PostulacionesRecibidasPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <PostulacionesRecibidasContent params={params} />
      </Suspense>
    </div>
  );
}

async function PostulacionesRecibidasContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/publicaciones/${slug}/postulaciones`);

  const publication = await prisma.publications.findUnique({
    where: { slug },
    select: {
      id: true,
      user_id: true,
      title: true,
      slug: true,
      publication_types: { select: { code: true } },
    },
  });
  const isAdmin = getUserRole(user) === "admin";
  if (!publication || (publication.user_id !== user.id && !isAdmin)) notFound();

  const applications = await prisma.applications.findMany({
    where: { publication_id: publication.id },
    orderBy: { created_at: "desc" },
    include: {
      users: { select: { name: true, email: true, profile_public: true } },
      application_files: { select: { filename: true, size_bytes: true } },
    },
  });

  const isInternship = publication.publication_types.code === "internship";
  const newCount = applications.filter((a) => a.status === "sent").length;

  return (
    <>
      <Link href={`/publicaciones/${publication.slug}`} className="text-sm font-medium text-unis-gray hover:text-unis-red">
        ← Volver a la publicación
      </Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-unis-text">Postulaciones recibidas</h1>
      <p className="mt-2 text-base text-unis-gray">{publication.title}</p>
      <p className="mt-1 text-sm text-unis-gray">
        {applications.length} {applications.length === 1 ? "solicitud" : "solicitudes"}
        {newCount > 0 ? ` · ${newCount} sin revisar` : ""}
      </p>

      <div className="mt-4">
        <Callout tone="info">
          Estos datos son personales: úsalos solo para gestionar esta solicitud y no los compartas con terceros. Abre los archivos adjuntos únicamente en un equipo con antivirus.
        </Callout>
      </div>

      {applications.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-unis-lightgray py-14 text-center text-sm text-unis-gray">
          Todavía no has recibido postulaciones.
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {applications.map((application) => {
            const links = [
              // Postulaciones antiguas pudieron enviar la hoja de vida como enlace.
              { label: "Hoja de vida (enlace)", url: isInternship ? application.cv_url : null },
              { label: isInternship ? "Portafolio" : "Sitio web o más información", url: application.portfolio_url },
              { label: "LinkedIn", url: application.linkedin_url },
              { label: "Perfil profesional", url: application.users.profile_public ? `/perfiles/${application.applicant_id}` : null },
            ].flatMap((l) => {
              const url = safeHttpUrl(l.url);
              return url ? [{ label: l.label, url }] : [];
            });

            return (
              <li key={application.id} className="rounded-lg border border-unis-lightgray bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-unis-text">{application.users.name || "Sin nombre"}</h2>
                    <p className="text-sm text-unis-gray">
                      <a href={`mailto:${application.users.email}`} className="hover:text-unis-red hover:underline">
                        {application.users.email}
                      </a>
                      {application.phone ? ` · ${application.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ApplicationStatusBadge status={application.status} />
                    <span className="text-xs text-unis-gray">{formatDate(application.created_at)}</span>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-unis-gray">{application.message}</p>

                {application.application_files ? (
                  <p className="mt-3 text-sm">
                    <a
                      href={`/api/applications/${application.id}/cv`}
                      className="inline-flex items-center gap-2 rounded-md border border-unis-lightgray px-3 py-1.5 font-medium text-unis-red hover:border-unis-red"
                    >
                      Descargar hoja de vida
                      <span className="text-xs font-normal text-unis-gray">
                        {application.application_files.filename} · {formatBytes(application.application_files.size_bytes)}
                      </span>
                    </a>
                  </p>
                ) : null}

                {links.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-unis-red hover:underline"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {application.status !== "withdrawn" ? (
                  <form action={updateApplicationStatus} className="mt-4 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={application.id} />
                    <label htmlFor={`status-${application.id}`} className="sr-only">
                      Estado de la postulación de {application.users.name}
                    </label>
                    <select
                      id={`status-${application.id}`}
                      name="status"
                      defaultValue={
                        isApplicationStatus(application.status) && application.status !== "sent"
                          ? application.status
                          : "viewed"
                      }
                      className={`${inputClass} max-w-52`}
                    >
                      {REVIEWER_APPLICATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {APPLICATION_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={secondaryButtonClass}>
                      Guardar estado
                    </button>
                  </form>
                ) : (
                  <p className="mt-4 text-xs text-unis-gray">La persona retiró esta postulación.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
