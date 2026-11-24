import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/session";
import { formatDateTime } from "../../../../lib/dates";
import { param } from "../../../../lib/query";
import {
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  isReportStatus,
} from "../../../../lib/reports";
import Callout from "../../../../components/ui/callout";
import { Field, FormError, FormNotice, inputClass, primaryButtonClass, secondaryButtonClass } from "../../../../components/ui/form";
import { reportPublication } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

export default function ReportarPublicacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <ReportarContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ReportarContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const user = await requireUser(`/publicaciones/${slug}/reportar`);
  const query = await searchParams;

  const publication = await prisma.publications.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true, status: true, user_id: true },
  });
  if (!publication) notFound();
  if (publication.user_id === user.id) redirect(`/publicaciones/${slug}`);

  const existing = await prisma.publication_reports.findUnique({
    where: { publication_id_reporter_id: { publication_id: publication.id, reporter_id: user.id } },
    select: { status: true, created_at: true },
  });

  const sent = param(query.reporte) === "enviado";
  const error = param(query.error);
  const errorMessage =
    error === "cuenta"
      ? "Tu cuenta debe estar activa para enviar un reporte."
      : error === "motivo"
        ? "Elige un motivo para el reporte."
        : error === "detalles"
          ? "Explica por qué denuncias: escribe entre 20 y 1000 caracteres."
          : error === "guardar"
            ? "No pudimos guardar el reporte. Intenta de nuevo."
            : undefined;

  return (
    <>
      <Link href={`/publicaciones/${publication.slug}`} className="text-sm font-medium text-unis-gray hover:text-unis-red">
        ← Volver a la publicación
      </Link>

      <h1 className="mt-3 text-3xl font-black tracking-tight text-unis-text">Reportar publicación</h1>
      <p className="mt-2 text-base text-unis-gray">
        Cuéntanos qué ocurre con «{publication.title}». Un administrador revisará el reporte y tomará una decisión.
      </p>

      <div className="mt-6 space-y-3">
        {sent ? (
          <FormNotice message="Recibimos tu reporte. Un administrador lo revisará y, si hace falta, retirará la publicación." />
        ) : null}
        <FormError message={errorMessage} />
      </div>

      {sent || existing ? (
        <div className="mt-6 space-y-4">
          {!sent && existing ? (
            <Callout tone="info">
              Ya reportaste esta publicación el {formatDateTime(existing.created_at)}. Estado del reporte:{" "}
              <span className="font-semibold">
                {isReportStatus(existing.status) ? REPORT_STATUS_LABELS[existing.status] : existing.status}
              </span>
              .
            </Callout>
          ) : null}
          <Link href={`/publicaciones/${publication.slug}`} className={secondaryButtonClass}>
            Volver a la publicación
          </Link>
        </div>
      ) : (
        <form action={reportPublication.bind(null, publication.slug)} className="mt-6 space-y-5 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
          <Field label="Motivo" htmlFor="reason" required>
            <select id="reason" name="reason" defaultValue="" required className={inputClass}>
              <option value="" disabled>
                Selecciona un motivo
              </option>
              {REPORT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {REPORT_REASON_LABELS[reason]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Justificación" required
            htmlFor="details"
            hint="Explica qué encontraste y por qué incumple las normas. Mínimo 20 caracteres, máximo 1000."
          >
            <textarea id="details" name="details" rows={5} maxLength={1000} minLength={20} required className={inputClass} />
          </Field>

          <p className="text-xs text-unis-gray">
            Tu nombre se comparte con los administradores, no con quien publicó. Los reportes falsos o abusivos pueden
            afectar tu cuenta.
          </p>

          <button type="submit" className={`${primaryButtonClass} w-full`}>
            Enviar reporte
          </button>
        </form>
      )}
    </>
  );
}
