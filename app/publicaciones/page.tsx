import { prisma } from "../../lib/prisma";
import PublicationCard from "../../components/publications/publication-card";
import Link from "next/link";

type SearchParams = {
  tipo?: string;
  carrera?: string;
  sector?: string;
  modalidad?: string;
};

export default async function PublicacionesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const where: any = {
    status: "published",
  };

  if (params.tipo) {
    where.publication_types = {
      code: params.tipo,
    };
  }

  if (params.modalidad) {
    where.modality = params.modalidad;
  }

  if (params.carrera) {
    where.publication_careers = {
      some: {
        careers: {
          slug: params.carrera,
        },
      },
    };
  }

  if (params.sector) {
    where.publication_sectors = {
      some: {
        sectors: {
          slug: params.sector,
        },
      },
    };
  }

  const [publications, publicationTypes, careers, sectors] = await Promise.all([
    prisma.publications.findMany({
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
      },
      orderBy: {
        published_at: "desc",
      },
    }),
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

  const hasFilters = params.tipo || params.carrera || params.sector || params.modalidad;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-unis-text sm:text-4xl">
            Publicaciones
          </h1>
          <p className="mt-2 text-base text-unis-gray">
            Ofertas de prácticas, solicitudes y colaboraciones B2B entre empresas, agremiaciones y emprendedores.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-6 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
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
                        ...(params.tipo === type.code ? {} : { tipo: type.code }),
                        ...(params.carrera ? { carrera: params.carrera } : {}),
                        ...(params.sector ? { sector: params.sector } : {}),
                        ...(params.modalidad ? { modalidad: params.modalidad } : {}),
                      }).toString()}`}
                      className={`block rounded-md px-2 py-1.5 text-sm transition ${
                        params.tipo === type.code
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
                        ...(params.tipo ? { tipo: params.tipo } : {}),
                        ...(params.carrera === career.slug ? {} : { carrera: career.slug }),
                        ...(params.sector ? { sector: params.sector } : {}),
                        ...(params.modalidad ? { modalidad: params.modalidad } : {}),
                      }).toString()}`}
                      className={`block rounded-md px-2 py-1.5 text-sm transition ${
                        params.carrera === career.slug
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
                        ...(params.tipo ? { tipo: params.tipo } : {}),
                        ...(params.carrera ? { carrera: params.carrera } : {}),
                        ...(params.sector === sector.slug ? {} : { sector: sector.slug }),
                        ...(params.modalidad ? { modalidad: params.modalidad } : {}),
                      }).toString()}`}
                      className={`block rounded-md px-2 py-1.5 text-sm transition ${
                        params.sector === sector.slug
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
                        ...(params.tipo ? { tipo: params.tipo } : {}),
                        ...(params.carrera ? { carrera: params.carrera } : {}),
                        ...(params.sector ? { sector: params.sector } : {}),
                        ...(params.modalidad === mod.value ? {} : { modalidad: mod.value }),
                      }).toString()}`}
                      className={`block rounded-md px-2 py-1.5 text-sm transition ${
                        params.modalidad === mod.value
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
                {publications.length} {publications.length === 1 ? "publicación encontrada" : "publicaciones encontradas"}
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
              <div className="grid grid-cols-1 gap-6">
                {publications.map((publication) => (
                  <PublicationCard key={publication.id} publication={publication} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
