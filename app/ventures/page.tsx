import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/session";
import { markSets } from "../../lib/listing";
import { buildQuery, pageNumber, param } from "../../lib/query";
import {
  BUSINESS_MODELS,
  BUSINESS_MODEL_LABELS,
  TRL_PHASES,
  VENTURE_TYPES,
  VENTURE_TYPE_LABELS,
  isBusinessModel,
  isVentureType,
} from "../../lib/ventures";
import VentureCard from "../../components/ventures/venture-card";
import VentureDetail, { type VentureDetailData } from "../../components/listing/venture-detail";
import FilterBar, { type FilterGroup } from "../../components/listing/filter-bar";
import { inputClass } from "../../components/ui/form";
import Pagination from "../../components/ui/pagination";
import PageHeader from "../../components/ui/page-header";
import RegisterVentureButton from "../../components/ventures/register-venture-button";
import { toggleHidden, toggleSaved, reportItem } from "../marcas/actions";

const VENTURES_PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

export default function VenturesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Ventures"
          description="Spin-offs y startups que nacen del ecosistema Winner: conocimiento de la academia y de los beneficiarios convertido en economía real."
          action={
            <Suspense fallback={null}>
              <RegisterVentureButton />
            </Suspense>
          }
        />
        <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-unis-bg" aria-busy="true" />}>
          <VenturesContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function VenturesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const user = await getCurrentUser();

  const tipo = param(raw.tipo);
  const sector = param(raw.sector);
  const modelo = param(raw.modelo);
  const fase = param(raw.fase);
  const q = param(raw.q);
  const ocultas = param(raw.ocultas) === "1" && Boolean(user);
  const ver = param(raw.ver);
  const page = pageNumber(param(raw.page));

  const activeTipo = isVentureType(tipo) ? tipo : undefined;
  const activeModelo = isBusinessModel(modelo) ? modelo : undefined;
  const activeFase = TRL_PHASES.find((p) => p.key === fase);

  const where: Prisma.venturesWhereInput = { status: "published" };
  if (activeTipo) where.type = activeTipo;
  if (sector) where.sectors = { slug: sector };
  if (activeModelo) where.business_model = activeModelo === "both" ? "both" : { in: [activeModelo, "both"] };
  if (activeFase) where.trl_level = { gte: activeFase.min, lte: activeFase.max };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (user) {
    const hiddenByMe = { venture_marks: { some: { user_id: user.id, hidden: true } } };
    if (ocultas) where.AND = [hiddenByMe];
    else where.NOT = hiddenByMe;
  }

  const [total, hiddenCount, sectors] = await Promise.all([
    prisma.ventures.count({ where }),
    user ? prisma.venture_marks.count({ where: { user_id: user.id, hidden: true } }) : Promise.resolve(0),
    prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / VENTURES_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const rows = await prisma.ventures.findMany({
    where,
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      tagline: true,
      trl_level: true,
      business_model: true,
      city: true,
      logo_url: true,
      published_at: true,
      sectors: { select: { name: true } },
    },
    orderBy: { published_at: "desc" },
    skip: (currentPage - 1) * VENTURES_PAGE_SIZE,
    take: VENTURES_PAGE_SIZE,
  });

  const selectedSlug = ver ?? rows[0]?.slug;
  const selected = selectedSlug
    ? await prisma.ventures.findFirst({
        where: { slug: selectedSlug, status: "published" },
        include: { sectors: { select: { name: true } } },
      })
    : null;

  const owner = selected
    ? await prisma.directory_profiles.findFirst({
        where: { user_id: selected.user_id, is_visible: true, users: { status: "active" } },
        select: { id: true, display_name: true, users: { select: { name: true } } },
      })
    : null;

  const markRows = user
    ? await prisma.venture_marks.findMany({
        where: { user_id: user.id, venture_id: { in: [...rows.map((r) => r.id), ...(selected ? [selected.id] : [])] } },
        select: { venture_id: true, saved: true, hidden: true },
      })
    : [];
  const marks = markSets(markRows.map((m) => ({ id: m.venture_id, saved: m.saved, hidden: m.hidden })));

  const base = { tipo, sector, modelo, fase, q, ocultas: ocultas ? "1" : undefined };
  const listHref = (overrides: Record<string, string | undefined>) => `/ventures${buildQuery(base, overrides)}`;
  const selectedHref = (slug: string) => `/ventures${buildQuery(base, { ver: slug, page: currentPage > 1 ? String(currentPage) : undefined })}`;
  const currentHref = `/ventures${buildQuery(base, { ver: selected?.slug, page: currentPage > 1 ? String(currentPage) : undefined })}`;

  const groups: FilterGroup[] = [
    {
      key: "tipo",
      label: "Tipo",
      activeLabel: activeTipo ? VENTURE_TYPE_LABELS[activeTipo] : undefined,
      options: [
        { label: "Todos los tipos", href: listHref({ tipo: undefined }), active: !activeTipo },
        ...VENTURE_TYPES.map((t) => ({ label: VENTURE_TYPE_LABELS[t], href: listHref({ tipo: t }), active: activeTipo === t })),
      ],
    },
    {
      key: "fase",
      label: "Madurez (TRL)",
      activeLabel: activeFase ? `${activeFase.label} (TRL ${activeFase.min}-${activeFase.max})` : undefined,
      options: [
        { label: "Cualquier madurez", href: listHref({ fase: undefined }), active: !activeFase },
        ...TRL_PHASES.map((p) => ({ label: `${p.label} (TRL ${p.min}-${p.max})`, href: listHref({ fase: p.key }), active: fase === p.key })),
      ],
    },
    {
      key: "modelo",
      label: "Modelo de negocio",
      activeLabel: activeModelo ? BUSINESS_MODEL_LABELS[activeModelo] : undefined,
      options: [
        { label: "Cualquier modelo", href: listHref({ modelo: undefined }), active: !activeModelo },
        ...BUSINESS_MODELS.map((m) => ({ label: BUSINESS_MODEL_LABELS[m], href: listHref({ modelo: m }), active: activeModelo === m })),
      ],
    },
    {
      key: "sector",
      label: "Sector",
      activeLabel: sectors.find((s) => s.slug === sector)?.name,
      options: [
        { label: "Todos los sectores", href: listHref({ sector: undefined }), active: !sector },
        ...sectors.map((s) => ({ label: s.name, href: listHref({ sector: s.slug }), active: sector === s.slug })),
      ],
    },
  ];

  const hasFilters = Boolean(tipo || sector || modelo || fase || q || ocultas);
  const actions = {
    toggleSavedAction: toggleSaved,
    toggleHiddenAction: toggleHidden,
    reportAction: reportItem.bind(null, "venture", selected?.id ?? ""),
  };

  const detail: VentureDetailData | null = selected
    ? {
        id: selected.id,
        slug: selected.slug,
        name: selected.name,
        tagline: selected.tagline,
        description: selected.description,
        type: selected.type,
        trl_level: selected.trl_level,
        business_model: selected.business_model,
        city: selected.city,
        sectors: selected.sectors,
        ownerName: owner ? owner.display_name || owner.users.name : null,
        ownerProfileLink: owner ? `/directorio/${owner.id}` : null,
        website: selected.website,
        linkedinUrl: selected.linkedin_url,
        contactEmail: selected.contact_email,
        stage: selected.service_stage,
        publishedAt: selected.published_at,
      }
    : null;

  return (
    <>
      <form action="/ventures" method="get" className="mt-6 flex flex-wrap items-center gap-3">
        {tipo ? <input type="hidden" name="tipo" value={tipo} /> : null}
        {sector ? <input type="hidden" name="sector" value={sector} /> : null}
        {modelo ? <input type="hidden" name="modelo" value={modelo} /> : null}
        {fase ? <input type="hidden" name="fase" value={fase} /> : null}
        {ocultas ? <input type="hidden" name="ocultas" value="1" /> : null}
        <label htmlFor="q" className="sr-only">
          Buscar ventures
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o palabra clave"
          className={`${inputClass} max-w-sm`}
        />
      </form>

      <div className="mt-4">
        <FilterBar
          groups={groups}
          clearHref={hasFilters ? "/ventures" : undefined}
          hidden={user ? { count: hiddenCount, href: listHref({ ocultas: ocultas ? undefined : "1" }), active: ocultas } : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-label="Listado de ventures" className="min-w-0 space-y-4 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto lg:pr-2">
          <p className="text-sm font-medium text-unis-gray">
            {total === 0
              ? ocultas
                ? "No tienes ventures ocultas."
                : "0 ventures encontradas"
              : `${total} ${total === 1 ? "venture encontrada" : "ventures encontradas"}${ocultas ? " ocultas" : ""}`}
          </p>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-unis-lightgray px-6 py-14 text-center">
              <h2 className="text-base font-semibold text-unis-text">
                {hasFilters ? "No hay ventures con estos filtros" : "Aún no hay ventures publicadas"}
              </h2>
              <p className="mt-2 text-sm text-unis-gray">
                {hasFilters
                  ? "Quita algún filtro para ver más resultados."
                  : "Cuando se aprueben las primeras spin-offs y startups, aparecerán aquí."}
              </p>
            </div>
          ) : (
            <>
              {rows.map((row) => (
                <VentureCard
                  key={row.id}
                  venture={{ ...row, status: undefined }}
                  href={selectedHref(row.slug)}
                  active={row.slug === selected?.slug}
                  saved={marks.saved.has(row.id)}
                  hidden={marks.hidden.has(row.id)}
                />
              ))}
              <Pagination label="Paginación de ventures" currentPage={currentPage} totalPages={totalPages} hrefFor={(p) => listHref({ page: p > 1 ? String(p) : undefined })} />
            </>
          )}
        </section>

        <section
          aria-label="Detalle de la venture"
          className="min-w-0 rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-6 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
        >
          {detail ? (
            <VentureDetail
              item={detail}
              saved={marks.saved.has(detail.id)}
              hidden={marks.hidden.has(detail.id)}
              nextPath={currentHref}
              signedIn={Boolean(user)}
              actions={actions}
            />
          ) : (
            <p className="py-16 text-center text-sm text-unis-gray">Selecciona una venture de la lista para ver sus detalles.</p>
          )}
        </section>
      </div>
    </>
  );
}
