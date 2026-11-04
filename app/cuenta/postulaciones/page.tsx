import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { formatDate } from "../../../lib/dates";
import { formatBytes } from "../../../lib/cv-file";
import { param } from "../../../lib/query";
import Callout from "../../../components/ui/callout";
import ConfirmButton from "../../../components/ui/confirm-button";
import { secondaryButtonClass } from "../../../components/ui/form";
import { ApplicationStatusBadge, PublicationStatusBadge } from "../../../components/publications/status-badges";
import { withdrawApplication } from "../../publicaciones/[slug]/actions";

type SearchParams = Record<string, string | string[] | undefined>;

export default function MisPostulacionesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <MisPostulacionesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MisPostulacionesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser("/cuenta/postulaciones");
  const params = await searchParams;

  const applications = await prisma.applications.findMany({
    where: { applicant_id: user.id },
    orderBy: { created_at: "desc" },
    include: {
      application_files: { select: { filename: true, size_bytes: true } },
      publications: {
        select: { title: true, slug: true, status: true, publication_types: { select: { name: true } } },
      },
    },
  });

  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-unis-text">Mis postulaciones</h1>
      <p className="mt-1 text-sm text-unis-gray">Las solicitudes que has enviado y cómo van.</p>

      {param(params.enviada) ? (
        <div className="mt-6">
          <Callout tone="success">Tu solicitud fue enviada. Quien publicó la oferta la revisará.</Callout>
        </div>
      ) : null}

      {applications.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-unis-lightgray py-14 text-center text-sm text-unis-gray">
          <p>Todavía no te has postulado a ninguna publicación.</p>
          <Link href="/publicaciones" className="mt-3 inline-block font-semibold text-unis-red hover:underline">
            Ver publicaciones
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {applications.map((application) => {
            const canWithdraw = ["sent", "viewed", "shortlisted"].includes(application.status);
            return (
              <li key={application.id} className="rounded-lg border border-unis-lightgray bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <ApplicationStatusBadge status={application.status} />
                  <span className="text-xs text-unis-gray">
                    {application.publications.publication_types.name} · enviada el {formatDate(application.created_at)}
                  </span>
                  {application.publications.status !== "published" ? (
                    <PublicationStatusBadge status={application.publications.status} />
                  ) : null}
                </div>
                <h2 className="mt-2 text-lg font-bold text-unis-text">
                  <Link href={`/publicaciones/${application.publications.slug}`} className="hover:text-unis-red">
                    {application.publications.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-unis-gray">{application.message}</p>
                {application.application_files ? (
                  <p className="mt-2 text-xs text-unis-gray">
                    Hoja de vida adjunta:{" "}
                    <a href={`/api/applications/${application.id}/cv`} className="font-medium text-unis-red hover:underline">
                      {application.application_files.filename}
                    </a>{" "}
                    ({formatBytes(application.application_files.size_bytes)})
                  </p>
                ) : null}

                {canWithdraw ? (
                  <form action={withdrawApplication} className="mt-4">
                    <input type="hidden" name="id" value={application.id} />
                    <ConfirmButton
                      message="¿Retirar esta postulación? No podrás enviar otra a la misma publicación."
                      className={secondaryButtonClass}
                    >
                      Retirar postulación
                    </ConfirmButton>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
