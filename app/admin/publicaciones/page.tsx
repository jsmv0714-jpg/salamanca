import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/permissions";
import { param } from "../../../lib/query";
import { formatDate } from "../../../lib/dates";
import {
  PUBLICATION_STATUSES,
  PUBLICATION_STATUS_LABELS,
  isPublicationStatus,
  type PublicationStatus,
} from "../../../lib/publications";
import Badge from "../../../components/ui/badge";
import { FormError, FormNotice, inputClass, primaryButtonClass, secondaryButtonClass } from "../../../components/ui/form";
import { PublicationStatusBadge } from "../../../components/publications/status-badges";
import { approvePublication, rejectPublication } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

export default function AdminPublicacionesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <AdminPublicacionesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminPublicacionesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin("/admin/publicaciones");
  const params = await searchParams;

  const requested = param(params.estado);
  const estado: PublicationStatus = isPublicationStatus(requested) ? requested : "in_review";
  const ok = param(params.ok);
  const error = param(params.error);

  const [publications, grouped] = await Promise.all([
    prisma.publications.findMany({
      where: { status: estado },
      orderBy: { updated_at: "desc" },
      take: 100,
      include: {
        publication_types: { select: { name: true } },
        users: { select: { name: true, email: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.publications.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts = new Map(grouped.map((g) => [g.status, g._count._all]));

  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-unis-text">Revisión de publicaciones</h1>
      <p className="mt-2 text-base text-unis-gray">
        Aprueba las ofertas, servicios y solicitudes para que aparezcan en el listado público.
      </p>

      <div className="mt-6 space-y-3">
        {ok === "aprobada" ? <FormNotice message="Publicación aprobada y publicada." /> : null}
        {ok === "rechazada" ? <FormNotice message="Publicación rechazada. Quien la creó verá el motivo." /> : null}
        {error === "motivo" ? <FormError message="Escribe un motivo de entre 5 y 500 caracteres para rechazar." /> : null}
      </div>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        {PUBLICATION_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/publicaciones?estado=${status}`}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              status === estado
                ? "bg-unis-red/5 font-semibold text-unis-red ring-1 ring-unis-red/30"
                : "text-unis-gray ring-1 ring-unis-lightgray hover:text-unis-text"
            }`}
          >
            {PUBLICATION_STATUS_LABELS[status]} ({counts.get(status) ?? 0})
          </Link>
        ))}
      </nav>

      {publications.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-unis-lightgray py-14 text-center text-sm text-unis-gray">
          No hay publicaciones con estado «{PUBLICATION_STATUS_LABELS[estado]}».
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {publications.map((publication) => (
            <li key={publication.id} className="rounded-lg border border-unis-lightgray bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="blue">{publication.publication_types.name}</Badge>
                <PublicationStatusBadge status={publication.status} />
                {publication._count.applications > 0 ? (
                  <Badge>{publication._count.applications} postulaciones</Badge>
                ) : null}
              </div>
              <h2 className="mt-2 text-lg font-bold text-unis-text">{publication.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-unis-gray">{publication.description}</p>
              <p className="mt-2 text-xs text-unis-gray">
                Creada por {publication.users.name || "Sin nombre"} ({publication.users.email}) ·{" "}
                {formatDate(publication.updated_at)}
              </p>
              {publication.rejection_reason ? (
                <p className="mt-2 text-xs text-red-700">Motivo del rechazo: {publication.rejection_reason}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-start gap-3">
                <Link href={`/publicaciones/${publication.slug}`} className={secondaryButtonClass}>
                  Ver publicación
                </Link>

                {publication.status === "in_review" || publication.status === "rejected" ? (
                  <form action={approvePublication}>
                    <input type="hidden" name="id" value={publication.id} />
                    <button type="submit" className={primaryButtonClass}>
                      Aprobar y publicar
                    </button>
                  </form>
                ) : null}

                {publication.status === "in_review" || publication.status === "published" ? (
                  <form action={rejectPublication} className="flex flex-1 flex-wrap items-start gap-2">
                    <input type="hidden" name="id" value={publication.id} />
                    <input
                      type="text"
                      name="reason"
                      required
                      minLength={5}
                      maxLength={500}
                      placeholder="Motivo del rechazo"
                      aria-label={`Motivo del rechazo de ${publication.title}`}
                      className={`${inputClass} min-w-52 flex-1`}
                    />
                    <button type="submit" className={secondaryButtonClass}>
                      Rechazar
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
