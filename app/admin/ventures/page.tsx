import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/permissions";
import { param } from "../../../lib/query";
import {
  VENTURE_STATUSES,
  VENTURE_STATUS_LABELS,
  VENTURE_TYPE_LABELS,
  isVentureStatus,
  isVentureType,
  type VentureStatus,
} from "../../../lib/ventures";
import Badge from "../../../components/ui/badge";
import { FormError, FormNotice, inputClass, primaryButtonClass, secondaryButtonClass } from "../../../components/ui/form";
import { approveVenture, rejectVenture } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

export default function AdminVenturesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <AdminVenturesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminVenturesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin("/admin/ventures");
  const params = await searchParams;

  const requested = param(params.estado);
  const estado: VentureStatus = isVentureStatus(requested) ? requested : "in_review";
  const ok = param(params.ok);
  const error = param(params.error);

  const [ventures, grouped] = await Promise.all([
    prisma.ventures.findMany({
      where: { status: estado },
      orderBy: { updated_at: "desc" },
      include: { sectors: true, users: { select: { name: true, email: true } } },
      take: 100,
    }),
    prisma.ventures.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts = new Map(grouped.map((g) => [g.status, g._count._all]));

  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-unis-text">Revisión de ventures</h1>
      <p className="mt-2 text-base text-unis-gray">
        Aprueba las spin-offs y startups que cumplen con el modelo Winner para que aparezcan en el listado público.
      </p>

      <div className="mt-6 space-y-3">
        {ok === "aprobada" ? <FormNotice message="Venture aprobada y publicada." /> : null}
        {ok === "rechazada" ? <FormNotice message="Venture rechazada. Su dueño verá el motivo." /> : null}
        {error === "motivo" ? <FormError message="Escribe un motivo de entre 5 y 500 caracteres para rechazar." /> : null}
      </div>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        {VENTURE_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/ventures?estado=${status}`}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              status === estado
                ? "bg-unis-red/5 font-semibold text-unis-red ring-1 ring-unis-red/30"
                : "text-unis-gray ring-1 ring-unis-lightgray hover:text-unis-text"
            }`}
          >
            {VENTURE_STATUS_LABELS[status]} ({counts.get(status) ?? 0})
          </Link>
        ))}
      </nav>

      {ventures.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-unis-lightgray py-14 text-center text-sm text-unis-gray">
          No hay ventures con estado «{VENTURE_STATUS_LABELS[estado]}».
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {ventures.map((venture) => (
            <li key={venture.id} className="rounded-lg border border-unis-lightgray bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={venture.type === "spin_off" ? "blue" : "red"}>
                  {isVentureType(venture.type) ? VENTURE_TYPE_LABELS[venture.type] : venture.type}
                </Badge>
                <Badge tone="neutral">TRL {venture.trl_level}</Badge>
                {venture.sectors ? <Badge tone="neutral">{venture.sectors.name}</Badge> : null}
              </div>
              <h2 className="mt-2 text-lg font-bold text-unis-text">{venture.name}</h2>
              {venture.tagline ? <p className="text-sm text-unis-gray">{venture.tagline}</p> : null}
              <p className="mt-2 text-xs text-unis-gray">
                Enviada por {venture.users.name || "Sin nombre"} ({venture.users.email})
              </p>
              {venture.rejection_reason ? (
                <p className="mt-2 text-xs text-red-700">Motivo del rechazo: {venture.rejection_reason}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-start gap-3">
                <Link href={`/ventures/${venture.slug}`} className={secondaryButtonClass}>
                  Ver ficha
                </Link>

                {venture.status !== "published" ? (
                  <form action={approveVenture}>
                    <input type="hidden" name="id" value={venture.id} />
                    <button type="submit" className={primaryButtonClass}>
                      Aprobar y publicar
                    </button>
                  </form>
                ) : null}

                {venture.status !== "rejected" && venture.status !== "draft" ? (
                  <form action={rejectVenture} className="flex flex-1 flex-wrap items-start gap-2">
                    <input type="hidden" name="id" value={venture.id} />
                    <input
                      type="text"
                      name="reason"
                      required
                      minLength={5}
                      maxLength={500}
                      placeholder="Motivo del rechazo"
                      aria-label={`Motivo del rechazo de ${venture.name}`}
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
