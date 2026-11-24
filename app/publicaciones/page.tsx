import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/session";
import { mediaPublicUrl } from "../../lib/storage";
import { authorDisplayName, markSets } from "../../lib/listing";
import { isModality, isPublicationTypeCode, MODALITY_LABELS, MODALITIES, PUBLICATIONS_PAGE_SIZE } from "../../lib/publications";
import { buildQuery, pageNumber, param } from "../../lib/query";
import PublicationCard from "../../components/listing/publication-card";
import PublicationDetail, { type PublicationDetailData } from "../../components/listing/publication-detail";
import FilterBar, { type FilterGroup } from "../../components/listing/filter-bar";
import Pagination from "../../components/ui/pagination";
import PageHeader from "../../components/ui/page-header";
import PublishButton from "../../components/publications/publish-button";
import { toggleHidden, toggleSaved, reportItem } from "../marcas/actions";

type SearchParams = Record<string, string | string[] | undefined>;

export default function PublicacionesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Publicaciones"
          description="Ofertas de prácticas, solicitudes y colaboraciones B2B entre empresas, agremiaciones y emprendedores."
          action={
            <Suspense fallback={null}>
              <PublishButton />
            </Suspense>
          }
        />
        <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-unis-bg" aria-busy="true" />}>
          <PublicacionesContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function PublicacionesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const user = await getCurrentUser();

  // Los valores de la URL no son de fiar: se validan contra los catálogos antes de Prisma.
  const tipo = param(params.tipo);
  const carrera = param(params.carrera);
  const sector = param(params.sector);
  const modalidad = param(params.modalidad);
  const ocultas = param(params.ocultas) === "1" && Boolean(user);
  const ver = param(params.ver);
  const page = pageNumber(param(params.page));

  const activeTipo = isPublicationTypeCode(tipo) ? tipo : undefined;
  const activeModalidad = isModality(modalidad) ? modalidad : undefined;

  const where: Prisma.publicationsWhereInput = { status: "published" };
  if (activeTipo) where.publication_types = { code: activeTipo };
  if (activeModalidad) where.modality = activeModalidad;
  if (carrera) where.publication_careers = { some: { careers: { slug: carrera } } };
  if (sector) where.publication_sectors = { some: { sectors: { slug: sector } } };
  if (user) {
    const hiddenByMe = { publication_marks: { some: { user_id: user.id, hidden: true } } };
    if (ocultas) where.AND = [hiddenByMe];
    else where.NOT = hiddenByMe;
  }

  const [total, hiddenCount, publicationTypes, careers, sectors] = await Promise.all([
    prisma.publications.count({ where }),
    user ? prisma.publication_marks.count({ where: { user_id: user.id, hidden: true } }) : Promise.resolve(0),
    prisma.publication_types.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
    prisma.careers.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
    prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PUBLICATIONS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const rows = await prisma.publications.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      location: true,
      deadline: true,
      published_at: true,
      modality: true,
      publication_types: { select: { name: true } },
      users: {
        select: {
          name: true,
          companies: { select: { trade_name: true } },
          associations: { select: { name: true } },
          entrepreneurs: { select: { project_name: true, first_name: true, last_name: true } },
        },
      },
    },
    orderBy: { published_at: "desc" },
    skip: (currentPage - 1) * PUBLICATIONS_PAGE_SIZE,
    take: PUBLICATIONS_PAGE_SIZE,
  });

  const selectedSlug = ver ?? rows[0]?.slug;
  const selected = selectedSlug
    ? await prisma.publications.findFirst({
        where: { slug: selectedSlug, status: { in: ["published", "closed"] } },
        include: {
          publication_types: { select: { name: true } },
          publication_sectors: { include: { sectors: { select: { name: true } } } },
          publication_careers: { include: { careers: { select: { name: true } } } },
          publication_areas: { include: { areas_of_expertise: { select: { name: true } } } },
          publication_media: { where: { kind: "image" }, orderBy: { position: "asc" }, take: 1, select: { storage_key: true } },
          users: {
            select: {
              name: true,
              companies: { select: { trade_name: true } },
              associations: { select: { name: true } },
              entrepreneurs: { select: { project_name: true, first_name: true, last_name: true } },
            },
          },
        },
      })
    : null;

  const marks = markSets(
    await (user
      ? prisma.publication_marks.findMany({
          where: { user_id: user.id, publication_id: { in: [...rows.map((r) => r.id), ...(selected ? [selected.id] : [])] } },
          select: { publication_id: true, saved: true, hidden: true },
        })
      : Promise.resolve([])).then((list) => list.map((m) => ({ id: m.publication_id, saved: m.saved, hidden: m.hidden })))
  );

  const base = { tipo, carrera, sector, modalidad, ocultas: ocultas ? "1" : undefined };
  const listHref = (overrides: Record<string, string | undefined>) => `/publicaciones${buildQuery(base, overrides)}`;
  const selectedHref = (slug: string) => `/publicaciones${buildQuery(base, { ver: slug, page: currentPage > 1 ? String(currentPage) : undefined })}`;
  const currentHref = `/publicaciones${buildQuery(base, { ver: selected?.slug, page: currentPage > 1 ? String(currentPage) : undefined })}`;

  const groups: FilterGroup[] = [
    {
      key: "tipo",
      label: "Tipo",
      activeLabel: activeTipo ? publicationTypes.find((t) => t.code === activeTipo)?.name : undefined,
      options: [
        { label: "Todos los tipos", href: listHref({ tipo: undefined }), active: !activeTipo },
        ...publicationTypes.map((t) => ({ label: t.name, href: listHref({ tipo: t.code }), active: activeTipo === t.code })),
      ],
    },
    {
      key: "carrera",
      label: "Carrera",
      activeLabel: careers.find((c) => c.slug === carrera)?.name,
      options: [
        { label: "Todas las carreras", href: listHref({ carrera: undefined }), active: !carrera },
        ...careers.map((c) => ({ label: c.name, href: listHref({ carrera: c.slug }), active: carrera === c.slug })),
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
    {
      key: "modalidad",
      label: "Modalidad",
      activeLabel: activeModalidad ? MODALITY_LABELS[activeModalidad] : undefined,
      options: [
        { label: "Cualquier modalidad", href: listHref({ modalidad: undefined }), active: !activeModalidad },
        ...MODALITIES.map((m) => ({ label: MODALITY_LABELS[m], href: listHref({ modalidad: m }), active: activeModalidad === m })),
      ],
    },
  ];

  const hasFilters = Boolean(activeTipo || carrera || sector || activeModalidad || ocultas);
  const actions = {
    toggleSavedAction: toggleSaved,
    toggleHiddenAction: toggleHidden,
    reportAction: reportItem.bind(null, "publication", selected?.id ?? ""),
  };

  const detail: PublicationDetailData | null = selected
    ? {
        id: selected.id,
        slug: selected.slug,
        title: selected.title,
        description: selected.description,
        requirements: selected.requirements,
        benefits: selected.benefits,
        location: selected.location,
        deadline: selected.deadline,
        modality: selected.modality,
        publishedAt: selected.published_at,
        typeName: selected.publication_types.name,
        authorName: authorDisplayName(selected.users),
        coverUrl: selected.publication_media[0] ? mediaPublicUrl(selected.publication_media[0].storage_key) : null,
        careers: selected.publication_careers.map((c) => c.careers.name),
        sectors: selected.publication_sectors.map((s) => s.sectors.name),
        areas: selected.publication_areas.map((a) => a.areas_of_expertise.name),
      }
    : null;

  return (
    <>
      <div className="mt-6">
        <FilterBar
          groups={groups}
          clearHref={hasFilters ? "/publicaciones" : undefined}
          hidden={user ? { count: hiddenCount, href: listHref({ ocultas: ocultas ? undefined : "1" }), active: ocultas } : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-label="Listado de publicaciones" className="min-w-0 space-y-4 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:pr-2">
          <p className="text-sm font-medium text-unis-gray">
            {total === 0
              ? ocultas
                ? "No tienes publicaciones ocultas."
                : "0 publicaciones encontradas"
              : `${total} ${total === 1 ? "publicación" : "publicaciones"}${ocultas ? " ocultas" : ""}`}
          </p>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-unis-lightgray px-6 py-14 text-center">
              <h2 className="text-base font-semibold text-unis-text">
                {hasFilters ? "No hay publicaciones con estos filtros" : "Todavía no hay publicaciones"}
              </h2>
              <p className="mt-2 text-sm text-unis-gray">
                {hasFilters ? "Quita algún filtro para ver más resultados." : "Vuelve pronto: se publicarán nuevas oportunidades."}
              </p>
            </div>
          ) : (
            <>
              {rows.map((row) => {
                return (
                  <PublicationCard
                    key={row.id}
                    item={{
                      slug: row.slug,
                      title: row.title,
                      typeName: row.publication_types.name,
                      authorName: authorDisplayName(row.users),
                      location: row.location,
                      deadline: row.deadline,
                      publishedAt: row.published_at,
                      modality: row.modality,
                    }}
                    href={selectedHref(row.slug)}
                    active={row.slug === selected?.slug}
                    saved={marks.saved.has(row.id)}
                    hidden={marks.hidden.has(row.id)}
                  />
                );
              })}
              <Pagination label="Paginación de publicaciones" currentPage={currentPage} totalPages={totalPages} hrefFor={(p) => listHref({ page: p > 1 ? String(p) : undefined })} />
            </>
          )}
        </section>

        <section
          aria-label="Detalle de la publicación"
          className="min-w-0 rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-6 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
        >
          {detail ? (
            <PublicationDetail
              item={detail}
              saved={marks.saved.has(detail.id)}
              hidden={marks.hidden.has(detail.id)}
              nextPath={currentHref}
              signedIn={Boolean(user)}
              actions={actions}
            />
          ) : (
            <p className="py-16 text-center text-sm text-unis-gray">Selecciona una publicación de la lista para ver sus detalles.</p>
          )}
        </section>
      </div>
    </>
  );
}
