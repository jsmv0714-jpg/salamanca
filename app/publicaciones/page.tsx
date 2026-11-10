import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import PublicationCard from "../../components/publications/publication-card";
import PublishButton from "../../components/publications/publish-button";
import Pagination from "../../components/ui/pagination";
import PageHeader from "../../components/ui/page-header";
import { isModality, isPublicationTypeCode, PUBLICATIONS_PAGE_SIZE } from "../../lib/publications";
import { buildQuery, pageNumber, param } from "../../lib/query";
import Link from "next/link";

type SearchParams = {
  tipo?: string | string[];
  carrera?: string | string[];
  sector?: string | string[];
  modalidad?: string | string[];
  page?: string | string[];
};

export default function PublicacionesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<PublicacionesSkeleton />}>
      <PublicacionesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PublicacionesContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Los valores de la URL no son de fiar: se normalizan y se validan contra los
  // catálogos antes de llegar a Prisma (un enum inválido produce un error 500).
  const activeTipo = param(params.tipo);
  const activeCarrera = param(params.carrera);
  const activeSector = param(params.sector);
  const activeModalidad = param(params.modalidad);

  const where: Prisma.publicationsWhereInput = {
    status: "published",
  };

  if (isPublicationTypeCode(activeTipo)) {
    where.publication_types = {
      code: activeTipo,
    };
  }

  if (isModality(activeModalidad)) {
    where.modality = activeModalidad;
  }

  if (activeCarrera) {
    where.publication_careers = {
      some: {
        careers: {
          slug: activeCarrera,
        },
      },
    };
  }

  if (activeSector) {
    where.publication_sectors = {
      some: {
        sectors: {
          slug: activeSector,
        },
      },
    };
  }

  const requestedPage = pageNumber(param(params.page));

  const [total, publicationTypes, careers, sectors] = await Promise.all([
    prisma.publications.count({ where }),
    prisma.publication_types.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    }),
    prisma.careers.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    }),
    prisma.sectors.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PUBLICATIONS_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const publications = await prisma.publications.findMany({
    where,
    include: {
      publication_types: true,
      publication_sectors: {
        include: {
          sectors: true,
        },
      },
      publication_careers: {
        include: {
          careers: true,
        },
      },
      publication_areas: {
        include: {
          areas_of_expertise: true,
        },
      },
      publication_media: {
        where: { kind: "image" },
        orderBy: { position: "asc" },
        take: 1,
        select: { storage_key: true, thumb_key: true },
      },
    },
    orderBy: {
      published_at: "desc",
    },
    skip: (currentPage - 1) * PUBLICATIONS_PAGE_SIZE,
    take: PUBLICATIONS_PAGE_SIZE,
  });

  const hasFilters = activeTipo || activeCarrera || activeSector || activeModalidad;
  const filters = {
    tipo: activeTipo,
    carrera: activeCarrera,
    sector: activeSector,
    modalidad: activeModalidad,
  };
  const pageHref = (page: number) =>
    `/publicaciones${buildQuery(filters, { page: page > 1 ? String(page) : undefined })}`;

  const firstOnPage = total === 0 ? 0 : (currentPage - 1) * PUBLICATIONS_PAGE_SIZE + 1;
  const lastOnPage = Math.min(currentPage * PUBLICATIONS_PAGE_SIZE, total);

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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-6 rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-unis-text">
                  Filtros
                </h2>
                {hasFilters && (
                  <Link
                    href="/publicaciones"
                    className="mt-2 inline-block text-xs font-medium text-unis-red hover:underline"
                  >
                    Limpiar filtros
                  </Link>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-unis-text">Tipo de publicación</h3>
                <div className="space-y-2">
                  {publicationTypes.map((type) => (
                    <Link
                      key={type.id}
                      href={`/publicaciones?${new URLSearchParams({
                        ...(activeTipo === type.code ? {} : { tipo: type.code }),
                        ...(activeCarrera ? { carrera: activeCarrera } : {}),
                        ...(activeSector ? { sector: activeSector } : {}),
                        ...(activeModalidad ? { modalidad: activeModalidad } : {}),
                      }).toString()}`}
                      className={`block rounded-md px-2 py-1.5 text-sm transition ${
                        activeTipo === type.code
                          ? "bg-unis-red/5 font-semibold text-unis-red"
                          : "text-unis-gray hover:bg-unis-bg hover:text-unis-text"
                      }`}
                    >
                      {type.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-unis-lightgray pt-6">
                <h3 className="mb-3 text-sm font-semibold text-unis-text">Carrera</h3>
                <div className="space-y-2">
                  {careers.map((career) => (
                    <Link
                      key={career.id}
                      href={`/publicaciones?${new URLSearchParams({
                        ...(activeTipo ? { tipo: activeTipo } : {}),
                        ...(activeCarrera === career.slug ? {} : { carrera: career.slug }),
                        ...(activeSector ? { sector: activeSector } : {}),
                        ...(activeModalidad ? { modalidad: activeModalidad } : {}),
                      }).toString()}`}
                      className={`block rounded-md px-2 py-1.5 text-sm transition ${
                        activeCarrera === career.slug
                          ? "bg-unis-red/5 font-semibold text-unis-red"
                          : "text-unis-gray hover:bg-unis-bg hover:text-unis-text"
                      }`}
                    >
                      {career.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-unis-lightgray pt-6">
                <h3 className="mb-3 text-sm font-semibold text-unis-text">Sector</h3>
                <div className="space-y-2">
                  {sectors.map((sector) => (
                    <Link
                      key={sector.id}
                      href={`/publicaciones?${new URLSearchParams({
                        ...(activeTipo ? { tipo: activeTipo } : {}),
                        ...(activeCarrera ? { carrera: activeCarrera } : {}),
                        ...(activeSector === sector.slug ? {} : { sector: sector.slug }),
                        ...(activeModalidad ? { modalidad: activeModalidad } : {}),
                      }).toString()}`}
                      className={`block rounded-md px-2 py-1.5 text-sm transition ${
                        activeSector === sector.slug
                          ? "bg-unis-red/5 font-semibold text-unis-red"
                          : "text-unis-gray hover:bg-unis-bg hover:text-unis-text"
                      }`}
                    >
                      {sector.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-unis-lightgray pt-6">
                <h3 className="mb-3 text-sm font-semibold text-unis-text">Modalidad</h3>
                <div className="space-y-2">
                  {[
                    { label: "Presencial", value: "presential" },
                    { label: "Remoto", value: "remote" },
                    { label: "Híbrido", value: "hybrid" },
                  ].map((mod) => (
                    <Link
                      key={mod.value}
                      href={`/publicaciones?${new URLSearchParams({
                        ...(activeTipo ? { tipo: activeTipo } : {}),
                        ...(activeCarrera ? { carrera: activeCarrera } : {}),
                        ...(activeSector ? { sector: activeSector } : {}),
                        ...(activeModalidad === mod.value ? {} : { modalidad: mod.value }),
                      }).toString()}`}
                      className={`block rounded-md px-2 py-1.5 text-sm transition ${
                        activeModalidad === mod.value
                          ? "bg-unis-red/5 font-semibold text-unis-red"
                          : "text-unis-gray hover:bg-unis-bg hover:text-unis-text"
                      }`}
                    >
                      {mod.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-unis-gray">
                {total === 0
                  ? "0 publicaciones encontradas"
                  : `Mostrando ${firstOnPage}–${lastOnPage} de ${total} ${
                      total === 1 ? "publicación" : "publicaciones"
                    }`}
              </p>
            </div>

            {publications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-unis-lightgray py-16 text-center">
                <h3 className="text-lg font-semibold text-unis-text">No hay publicaciones con estos filtros</h3>
                <p className="mt-2 text-sm text-unis-gray">Prueba quitando algún filtro para ver más resultados.</p>
                <Link
                  href="/publicaciones"
                  className="mt-6 rounded-md bg-unis-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Ver todas las publicaciones
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6">
                  {publications.map((publication) => (
                    <PublicationCard key={publication.id} publication={publication} />
                  ))}
                </div>

                <Pagination
                  label="Paginación de publicaciones"
                  currentPage={currentPage}
                  totalPages={totalPages}
                  hrefFor={pageHref}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function PublicacionesSkeleton() {
  return (
    <div className="bg-white" aria-busy="true">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-10 w-56 animate-pulse rounded bg-unis-lightgray" />
        <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-unis-lightgray" />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="h-96 animate-pulse rounded-lg bg-unis-bg lg:col-span-1" />
          <div className="space-y-4 lg:col-span-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-unis-bg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
