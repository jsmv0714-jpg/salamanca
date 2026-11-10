import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { loadDirectory, type DirectoryFilters } from "../../lib/directory";
import { buildQuery, pageNumber, param } from "../../lib/query";
import {
  ALLIANCE_LABELS,
  BUSINESS_MODEL_LABELS,
  DIRECTORY_ROLES,
  DIRECTORY_ROLE_PLURALS,
  isBusinessModel,
  isDirectoryRole,
} from "../../lib/ventures";
import DirectoryCard from "../../components/directory/directory-card";
import { inputClass } from "../../components/ui/form";
import Pagination from "../../components/ui/pagination";
import PageHeader from "../../components/ui/page-header";

const DIRECTORY_PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

export default function DirectorioPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Directorio"
          description="Las empresas, agremiaciones, emprendedores y consultores del ecosistema Winner: quién ofrece qué y en qué puede asesorar."
        />

        <Suspense fallback={<ListSkeleton />}>
          <DirectorioContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function DirectorioContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const current = {
    tipo: param(raw.tipo),
    sector: param(raw.sector),
    area: param(raw.area),
    modelo: param(raw.modelo),
    alianza: param(raw.alianza),
    q: param(raw.q),
  };

  const filters: DirectoryFilters = {
    tipo: isDirectoryRole(current.tipo) ? current.tipo : undefined,
    sector: current.sector,
    area: current.area,
    modelo: isBusinessModel(current.modelo) ? current.modelo : undefined,
    alianza: current.alianza === "active" || current.alianza === "intention" ? current.alianza : undefined,
    q: current.q,
  };

  const [entries, sectors, areas] = await Promise.all([
    loadDirectory(filters),
    prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
    prisma.areas_of_expertise.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
  ]);

  const hasFilters = Object.values(current).some(Boolean);
  const linkClass = (active: boolean) =>
    `block rounded-md px-2 py-1.5 text-sm transition ${
      active
        ? "bg-unis-red/5 font-semibold text-unis-red"
        : "text-unis-gray hover:bg-unis-bg hover:text-unis-text"
    }`;
  const href = (overrides: Record<string, string | undefined>) => `/directorio${buildQuery(current, overrides)}`;

  const totalPages = Math.max(1, Math.ceil(entries.length / DIRECTORY_PAGE_SIZE));
  const currentPage = Math.min(pageNumber(param(raw.page)), totalPages);
  const pageEntries = entries.slice((currentPage - 1) * DIRECTORY_PAGE_SIZE, currentPage * DIRECTORY_PAGE_SIZE);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <aside className="lg:col-span-1">
        <div className="sticky top-6 space-y-6 rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm">
          <form action="/directorio" method="get" className="space-y-2">
            {Object.entries(current).map(([key, value]) =>
              key !== "q" && value ? <input key={key} type="hidden" name={key} value={value} /> : null
            )}
            <label htmlFor="q" className="text-sm font-semibold text-unis-text">
              Buscar
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={current.q ?? ""}
              placeholder="Nombre, ciudad o asesoría"
              className={inputClass}
            />
          </form>

          {hasFilters ? (
            <Link href="/directorio" className="inline-block text-xs font-medium text-unis-red hover:underline">
              Limpiar filtros
            </Link>
          ) : null}

          <div className="border-t border-unis-lightgray pt-6">
            <h2 className="mb-3 text-sm font-semibold text-unis-text">Tipo de miembro</h2>
            <div className="space-y-1">
              {DIRECTORY_ROLES.map((role) => (
                <Link
                  key={role}
                  href={href({ tipo: current.tipo === role ? undefined : role })}
                  className={linkClass(current.tipo === role)}
                >
                  {DIRECTORY_ROLE_PLURALS[role]}
                </Link>
              ))}
            </div>
          </div>

          {areas.length > 0 ? (
            <div className="border-t border-unis-lightgray pt-6">
              <h2 className="mb-3 text-sm font-semibold text-unis-text">Área de asesoría</h2>
              <div className="space-y-1">
                {areas.map((area) => (
                  <Link
                    key={area.id}
                    href={href({ area: current.area === area.slug ? undefined : area.slug })}
                    className={linkClass(current.area === area.slug)}
                  >
                    {area.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-unis-lightgray pt-6">
            <h2 className="mb-3 text-sm font-semibold text-unis-text">Modelo de negocio</h2>
            <div className="space-y-1">
              {(["b2b", "b2c", "both"] as const).map((m) => (
                <Link
                  key={m}
                  href={href({ modelo: current.modelo === m ? undefined : m })}
                  className={linkClass(current.modelo === m)}
                >
                  {BUSINESS_MODEL_LABELS[m]}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-unis-lightgray pt-6">
            <h2 className="mb-3 text-sm font-semibold text-unis-text">Alianza (empresas)</h2>
            <div className="space-y-1">
              {(["active", "intention"] as const).map((a) => (
                <Link
                  key={a}
                  href={href({ alianza: current.alianza === a ? undefined : a })}
                  className={linkClass(current.alianza === a)}
                >
                  {ALLIANCE_LABELS[a]}
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
                    href={href({ sector: current.sector === s.slug ? undefined : s.slug })}
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
          {entries.length} {entries.length === 1 ? "miembro encontrado" : "miembros encontrados"}
        </p>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-unis-lightgray py-16 text-center">
            <h3 className="text-lg font-semibold text-unis-text">
              {hasFilters ? "No hay miembros con estos filtros" : "El directorio aún está vacío"}
            </h3>
            <p className="mt-2 max-w-md text-sm text-unis-gray">
              {hasFilters
                ? "Prueba quitando algún filtro para ver más resultados."
                : "Los miembros aparecen aquí cuando su cuenta está activa y activan su perfil del directorio desde Mi cuenta."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {pageEntries.map((entry) => (
                <DirectoryCard key={entry.id} entry={entry} />
              ))}
            </div>
            <Pagination
              label="Paginación del directorio"
              currentPage={currentPage}
              totalPages={totalPages}
              hrefFor={(page) => href({ page: page > 1 ? String(page) : undefined })}
            />
          </>
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
