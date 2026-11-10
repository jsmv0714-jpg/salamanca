import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/permissions";
import { param } from "../../../lib/query";
import { formatDateTime } from "../../../lib/dates";
import {
  REPORT_REASON_LABELS,
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
  isReportReason,
  isReportStatus,
  type ReportStatus,
} from "../../../lib/reports";
import Badge from "../../../components/ui/badge";
import Callout from "../../../components/ui/callout";
import ConfirmButton from "../../../components/ui/confirm-button";
import { FormNotice, inputClass, primaryButtonClass, secondaryButtonClass } from "../../../components/ui/form";
import { PublicationStatusBadge } from "../../../components/publications/status-badges";
import { dismissReport, resolveReport, unpublishFromReport } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

export default function AdminReportesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <AdminReportesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminReportesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin("/admin/reportes");
  const params = await searchParams;

  const requested = param(params.estado);
  const estado: ReportStatus = isReportStatus(requested) ? requested : "open";
  const ok = param(params.ok);

  const [reports, grouped] = await Promise.all([
    prisma.publication_reports.findMany({
      where: { status: estado },
      orderBy: { created_at: "desc" },
      take: 100,
      include: {
        publications: {
          select: {
            title: true,
            slug: true,
            status: true,
            users: { select: { name: true, email: true } },
          },
        },
        users: { select: { name: true, email: true } },
        reviewed_by: { select: { name: true, email: true } },
      },
    }),
    prisma.publication_reports.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts = new Map(grouped.map((group) => [group.status, group._count._all]));

  return (
    <>
      <Link href="/cuenta" className="text-sm font-medium text-unis-gray hover:text-unis-red">
        ← Volver a mi cuenta
      </Link>

      <h1 className="mt-3 text-3xl font-black tracking-tight text-unis-text">Reportes de abuso</h1>
      <p className="mt-2 text-base text-unis-gray">
        Revisa lo que reportan los usuarios. Puedes resolver el reporte, descartarlo o retirar la publicación.
      </p>

      <div className="mt-6 space-y-3">
        {ok === "resuelto" ? <FormNotice message="Reporte marcado como resuelto." /> : null}
        {ok === "descartado" ? <FormNotice message="Reporte descartado. Quien lo envió recibió un aviso." /> : null}
        {ok === "oculta" ? (
          <FormNotice message="Publicación retirada y reportes abiertos resueltos. Avisamos a quien publicó y a quienes reportaron." />
        ) : null}
      </div>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filtrar reportes por estado">
        {REPORT_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/reportes?estado=${status}`}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              status === estado
                ? "bg-unis-red/5 font-semibold text-unis-red ring-1 ring-unis-red/30"
                : "text-unis-gray ring-1 ring-unis-lightgray hover:text-unis-text"
            }`}
          >
            {REPORT_STATUS_LABELS[status]} ({counts.get(status) ?? 0})
          </Link>
        ))}
      </nav>

      {estado === "open" ? (
        <div className="mt-6">
          <Callout tone="info">
            Retirar una publicación no borra los datos: la deja como rechazada con el motivo visible para quien la creó,
            y resuelve todos sus reportes abiertos.
          </Callout>
        </div>
      ) : null}

      {reports.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-unis-lightgray py-14 text-center text-sm text-unis-gray">
          {estado === "open"
            ? "No hay reportes abiertos. Todo en orden."
            : `No hay reportes en estado «${REPORT_STATUS_LABELS[estado]}».`}
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {reports.map((report) => {
            const reasonLabel = isReportReason(report.reason)
              ? REPORT_REASON_LABELS[report.reason]
              : report.reason;

            return (
              <li key={report.id} className="rounded-lg border border-unis-lightgray bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={report.status === "open" ? "amber" : report.status === "resolved" ? "green" : "neutral"}>
                    {isReportStatus(report.status) ? REPORT_STATUS_LABELS[report.status] : report.status}
                  </Badge>
                  <Badge tone="danger">{reasonLabel}</Badge>
                  <PublicationStatusBadge status={report.publications.status} />
                </div>

                <h2 className="mt-2 text-lg font-bold text-unis-text">{report.publications.title}</h2>

                <p className="mt-1 text-xs text-unis-gray">
                  Reportado por{" "}
                  {report.users ? `${report.users.name || "Sin nombre"} (${report.users.email})` : "una cuenta eliminada"} ·{" "}
                  {formatDateTime(report.created_at)}
                </p>
                <p className="mt-1 text-xs text-unis-gray">
                  Publicada por {report.publications.users.name || "Sin nombre"} ({report.publications.users.email})
                </p>

                {report.details ? (
                  <p className="mt-3 whitespace-pre-line rounded-md bg-unis-bg px-4 py-3 text-sm text-unis-gray">
                    {report.details}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-unis-gray">Sin detalles adicionales.</p>
                )}

                {report.admin_note ? (
                  <p className="mt-3 text-xs text-unis-gray">
                    <span className="font-semibold text-unis-text">Nota:</span> {report.admin_note}
                  </p>
                ) : null}

                {report.reviewed_by && report.reviewed_at ? (
                  <p className="mt-1 text-xs text-unis-gray">
                    Revisado por {report.reviewed_by.name || report.reviewed_by.email} ·{" "}
                    {formatDateTime(report.reviewed_at)}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link href={`/publicaciones/${report.publications.slug}`} className={secondaryButtonClass}>
                    Ver publicación
                  </Link>
                </div>

                {report.status === "open" ? (
                  <form className="mt-4 space-y-3 border-t border-unis-lightgray pt-4">
                    <input type="hidden" name="id" value={report.id} />
                    <input
                      type="text"
                      name="admin_note"
                      maxLength={500}
                      placeholder="Nota de la decisión (opcional, máximo 500 caracteres)"
                      aria-label={`Nota para el reporte de ${report.publications.title}`}
                      className={inputClass}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" formAction={resolveReport} className={secondaryButtonClass}>
                        Marcar resuelto
                      </button>
                      <button type="submit" formAction={dismissReport} className={secondaryButtonClass}>
                        Descartar
                      </button>
                      <ConfirmButton
                        formAction={unpublishFromReport}
                        message={`¿Retirar la publicación "${report.publications.title}"? Dejará de ser visible y se resolverán todos sus reportes abiertos.`}
                        className={primaryButtonClass}
                      >
                        Retirar publicación
                      </ConfirmButton>
                    </div>
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
