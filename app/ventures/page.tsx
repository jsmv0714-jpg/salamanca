import { Suspense } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { buildQuery, param } from "../../lib/query";
import {
  BUSINESS_MODEL_LABELS,
  TRL_PHASES,
  VENTURE_TYPES,
  VENTURE_TYPE_LABELS,
  isVentureType,
} from "../../lib/ventures";
import VentureCard from "../../components/ventures/venture-card";
import { inputClass, primaryButtonClass } from "../../components/ui/form";

type SearchParams = Record<string, string | string[] | undefined>;

export default function VenturesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-unis-text sm:text-4xl">Ventures</h1>
            <p className="mt-2 max-w-2xl text-base text-unis-gray">
              Spin-offs y startups que nacen del ecosistema Winner: conocimiento de la academia y de los
              beneficiarios convertido en economía real.
            </p>
          </div>
          <Link href="/ventures/nueva" className={primaryButtonClass}>
            Registrar una venture
          </Link>
        </div>

        <Suspense fallback={<ListSkeleton />}>
          <VenturesContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function VenturesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const current = {
    tipo: param(raw.tipo),
    sector: param(raw.sector),
    modelo: param(raw.modelo),
    fase: param(raw.fase),
    q: param(raw.q),
  };

  const where: Prisma.venturesWhereInput = { status: "published" };
  if (current.tipo && isVentureType(current.tipo)) where.type = current.tipo;
  if (current.sector) where.sectors = { slug: current.sector };
  if (current.modelo === "b2b" || current.modelo === "b2c") {
    where.business_model = { in: [current.modelo, "both"] };
  } else if (current.modelo === "both") {
    where.business_model = "both";
  }
  const phase = TRL_PHASES.find((p) => p.key === current.fase);
  if (phase) where.trl_level = { gte: phase.min, lte: phase.max };
  if (current.q) {
    where.OR = [
      { name: { contains: current.q, mode: "insensitive" } },
      { tagline: { contains: current.q, mode: "insensitive" } },
      { description: { contains: current.q, mode: "insensitive" } },
    ];
  }

  const [ventures, sectors] = await Promise.all([
    prisma.ventures.findMany({
      where,
      include: { sectors: true },
      orderBy: { published_at: "desc" },
      take: 100,
    }),
    prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
  ]);

  const hasFilters = Object.values(current).some(Boolean);
  const linkClass = (active: boolean) =>
    `block rounded-md px-2 py-1.5 text-sm transition ${
      active
        ? "bg-unis-red/5 font-semibold text-unis-red"
        : "text-unis-gray hover:bg-unis-bg hover:text-unis-text"
    }`;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <aside className="lg:col-span-1">
        <div className="sticky top-6 space-y-6 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
          <form action="/ventures" method="get" className="space-y-2">
            {current.tipo ? <input type="hidden" name="tipo" value={current.tipo} /> : null}
            {current.sector ? <input type="hidden" name="sector" value={current.sector} /> : null}
            {current.modelo ? <input type="hidden" name="modelo" value={current.modelo} /> : null}
            {current.fase ? <input type="hidden" name="fase" value={current.fase} /> : null}
            <label htmlFor="q" className="text-sm font-semibold text-unis-text">
              Buscar
            </label>
            <input id="q" name="q" type="search" defaultValue={current.q ?? ""} placeholder="Nombre o palabra clave" className={inputClass} />
          </form>

          {hasFilters ? (
            <Link href="/ventures" className="inline-block text-xs font-medium text-unis-red hover:underline">
              Limpiar filtros
            </Link>
          ) : null}

          <div className="border-t border-unis-lightgray pt-6">
            <h2 className="mb-3 text-sm font-semibold text-unis-text">Tipo</h2>
            <div className="space-y-1">
              {VENTURE_TYPES.map((t) => (
                <Link
                  key={t}
                  href={`/ventures${buildQuery(current, { tipo: current.tipo === t ? undefined : t })}`}
                  className={linkClass(current.tipo === t)}
                >
                  {VENTURE_TYPE_LABELS[t]}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-unis-lightgray pt-6">
            <h2 className="mb-3 text-sm font-semibold text-unis-text">Madurez (TRL)</h2>
            <div className="space-y-1">
              {TRL_PHASES.map((p) => (
                <Link
                  key={p.key}
                  href={`/ventures${buildQuery(current, { fase: current.fase === p.key ? undefined : p.key })}`}
                  className={linkClass(current.fase === p.key)}
                >
                  {p.label} (TRL {p.min}-{p.max})
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-unis-lightgray pt-6">
            <h2 className="mb-3 text-sm font-semibold text-unis-text">Modelo de negocio</h2>
            <div className="space-y-1">
              {(["b2b", "b2c", "both"] as const).map((m) => (
                <Link
                  key={m}
                  href={`/ventures${buildQuery(current, { modelo: current.modelo === m ? undefined : m })}`}
                  className={linkClass(current.modelo === m)}
                >
                  {BUSINESS_MODEL_LABELS[m]}
                </Link>
              ))}
            </div>
          </div>

          {sectors.length > 0 ? (
            <div className="border-t border-unis-lightgray pt-6">
              <h2 className="mb-3 text-sm font-semibold text-unis-text">Sector</h2>
              <div className="space-y-1">
                {sectors.map((s) => (
                  <Link
                    key={s.id}
                    href={`/ventures${buildQuery(current, { sector: current.sector === s.slug ? undefined : s.slug })}`}
                    className={linkClass(current.sector === s.slug)}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      <section className="lg:col-span-3">
        <p className="mb-4 text-sm text-unis-gray">
          {ventures.length} {ventures.length === 1 ? "venture encontrada" : "ventures encontradas"}
        </p>

        {ventures.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-unis-lightgray py-16 text-center">
            <h3 className="text-lg font-semibold text-unis-text">
              {hasFilters ? "No hay ventures con estos filtros" : "Aún no hay ventures publicadas"}
            </h3>
            <p className="mt-2 text-sm text-unis-gray">
              {hasFilters
                ? "Prueba quitando algún filtro para ver más resultados."
                : "Cuando se aprueben las primeras spin-offs y startups, aparecerán aquí."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {ventures.map((venture) => (
              <VentureCard key={venture.id} venture={venture} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4" aria-busy="true">
      <div className="h-96 animate-pulse rounded-lg bg-unis-bg lg:col-span-1" />
      <div className="space-y-4 lg:col-span-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-unis-bg" />
        ))}
      </div>
    </div>
  );
}
