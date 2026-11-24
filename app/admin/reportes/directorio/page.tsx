import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/permissions";
import { param } from "../../../../lib/query";
import { formatDateTime } from "../../../../lib/dates";
import { REPORT_REASON_LABELS, REPORT_STATUSES, REPORT_STATUS_LABELS, isReportReason, isReportStatus, type ReportStatus } from "../../../../lib/reports";
import Badge from "../../../../components/ui/badge";
import ConfirmButton from "../../../../components/ui/confirm-button";
import { FormNotice, inputClass, primaryButtonClass, secondaryButtonClass } from "../../../../components/ui/form";
import { dismissDirectoryReport, hideDirectoryProfileFromReport, resolveDirectoryReport } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

const OK_MESSAGES: Record<string, string> = {
  resuelto: "Denuncia marcada como resuelta.",
  descartado: "Denuncia descartada. Quien la envió recibió un aviso.",
  oculto: "Perfil ocultado del directorio. Avisamos a su dueño y a quienes denunciaron.",
};

export default function AdminDirectoryReportesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <AdminDirectoryReportesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminDirectoryReportesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin("/admin/reportes/directorio");
  const params = await searchParams;
  const requested = param(params.estado);
  const estado: ReportStatus = isReportStatus(requested) ? requested : "open";
  const ok = param(params.ok);

  const [reports, grouped] = await Promise.all([
    prisma.directory_reports.findMany({
      where: { status: estado },
      orderBy: { created_at: "desc" },
      take: 100,
      include: {
        directory_profiles: {
          select: {
            id: true,
            display_name: true,
            is_visible: true,
            users: { select: { name: true, email: true } },
          },
        },
        users: { select: { name: true, email: true } },
        reviewed_by: { select: { name: true, email: true } },
      },
    }),
    prisma.directory_reports.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts = new Map(grouped.map((g) => [g.status, g._count._all]));

  return (
    <>
      <Link href="/admin/reportes" className="text-sm font-medium text-unis-gray hover:text-unis-red">
        ← Denuncias de publicaciones
      </Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-unis-text">Denuncias del directorio</h1>
      <p className="mt-2 text-base text-unis-gray">
        Cada denuncia incluye la justificación de quien la envió. Puedes resolverla, descartarla u ocultar el perfil.
      </p>

      <div className="mt-6 space-y-3">{ok && OK_MESSAGES[ok] ? <FormNotice message={OK_MESSAGES[ok]} /> : null}</div>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filtrar denuncias del directorio por estado">
        {REPORT_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/reportes/directorio?estado=${status}`}
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

      {reports.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-unis-lightgray py-14 text-center text-sm text-unis-gray">
          No hay denuncias en estado {REPORT_STATUS_LABELS[estado].toLowerCase()}.
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {reports.map((report) => {
            const profile = report.directory_profiles;
            const label = profile.display_name || profile.users.name || "Miembro del directorio";
            return (
              <li key={report.id} className="rounded-lg border border-unis-lightgray bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={report.status === "open" ? "amber" : report.status === "resolved" ? "green" : "neutral"}>
                    {REPORT_STATUS_LABELS[report.status]}
                  </Badge>
                  <Badge tone="danger">{isReportReason(report.reason) ? REPORT_REASON_LABELS[report.reason] : report.reason}</Badge>
                  <Badge tone="neutral">Perfil {profile.is_visible ? "visible" : "oculto"}</Badge>
                </div>

                <h2 className="mt-2 text-lg font-bold text-unis-text">{label}</h2>
                <p className="mt-1 text-xs text-unis-gray">
                  Denunciado por {report.users ? `${report.users.name || "Sin nombre"} (${report.users.email})` : "una cuenta eliminada"} ·{" "}
                  {formatDateTime(report.created_at)}
                </p>
                <p className="mt-1 text-xs text-unis-gray">
                  Miembro: {profile.users.name || "Sin nombre"} ({profile.users.email})
                </p>

                <p className="mt-3 whitespace-pre-line rounded-md bg-unis-bg px-4 py-3 text-sm text-unis-gray">{report.details}</p>

                {report.admin_note ? (
                  <p className="mt-3 text-xs text-unis-gray">
                    <span className="font-semibold text-unis-text">Nota:</span> {report.admin_note}
                  </p>
                ) : null}
                {report.reviewed_by && report.reviewed_at ? (
                  <p className="mt-1 text-xs text-unis-gray">
                    Revisada por {report.reviewed_by.name || report.reviewed_by.email} · {formatDateTime(report.reviewed_at)}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link href={`/directorio?ver=${profile.id}`} className={secondaryButtonClass}>
                    Ver perfil
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
                      aria-label={`Nota para la denuncia de ${label}`}
                      className={inputClass}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" formAction={resolveDirectoryReport} className={secondaryButtonClass}>
                        Marcar resuelta
                      </button>
                      <button type="submit" formAction={dismissDirectoryReport} className={secondaryButtonClass}>
                        Descartar
                      </button>
                      <ConfirmButton
                        formAction={hideDirectoryProfileFromReport}
                        message={`¿Ocultar el perfil de "${label}" del directorio? Se resolverán sus denuncias abiertas y avisaremos a su dueño.`}
                        className={primaryButtonClass}
                      >
                        Ocultar perfil
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
