import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/session";
import { loadDirectory, type DirectoryEntry, type DirectoryFilters } from "../../lib/directory";
import { buildQuery, param } from "../../lib/query";
import {
  ALLIANCE_LABELS,
  BUSINESS_MODEL_LABELS,
  DIRECTORY_ROLES,
  DIRECTORY_ROLE_PLURALS,
  isBusinessModel,
  isDirectoryRole,
} from "../../lib/ventures";
import DirectoryCard from "../../components/directory/directory-card";
import MemberDetail from "../../components/listing/member-detail";
import FilterBar, { type FilterGroup } from "../../components/listing/filter-bar";
import Pagination from "../../components/ui/pagination";
import PageHeader from "../../components/ui/page-header";
import { reportItem, toggleHidden, toggleSaved } from "../marcas/actions";

const DIRECTORY_PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

type DirFiltersActive = {
  tipo?: DirectoryRoleFilter;
  sector?: string;
  area?: string;
  modelo?: BusinessModelFilter;
  alianza?: AllianceFilter;
  q?: string;
};

type DirectoryRoleFilter = "company" | "association" | "entrepreneur" | "teacher";
type BusinessModelFilter = "b2b" | "b2c" | "both";
type AllianceFilter = "active" | "intention";

export const metadata: Metadata = {
  title: "Directorio | Unisalamanca Marketplace",
  description: "Empresas, agremiaciones, emprendedores y consultores del ecosistema Winner.",
};

export default function DirectorioPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Directorio"
          description="Las empresas, agremiaciones, emprendedores y consultores del ecosistema Winner: quién ofrece qué y en qué puede asesorar."
        />
        <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-white" aria-busy="true" />}>
          <DirectorioContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function DirectorioContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const current: DirFiltersActive = {
    tipo: isDirectoryRole(param(raw.tipo)) ? (param(raw.tipo) as DirectoryRoleFilter) : undefined,
    sector: param(raw.sector),
    area: param(raw.area),
    modelo: isBusinessModel(param(raw.modelo)) ? (param(raw.modelo) as BusinessModelFilter) : undefined,
    alianza: param(raw.alianza) === "active" || param(raw.alianza) === "intention" ? (param(raw.alianza) as AllianceFilter) : undefined,
    q: param(raw.q),
  };

  const filters: DirectoryFilters = {
    tipo: current.tipo,
    sector: current.sector,
    area: current.area,
    modelo: current.modelo,
    alianza: current.alianza,
    q: current.q,
  };

  const [user, entries, sectors, areas] = await Promise.all([
    getCurrentUser(),
    loadDirectory(filters),
    prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
    prisma.areas_of_expertise.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
  ]);

  const hasFilters = Object.values(current).some(Boolean);
  const href = (overrides: Record<string, string | undefined>) => `/directorio${buildQuery(current as Record<string, string | undefined>, overrides)}`;

  const totalPages = Math.max(1, Math.ceil(entries.length / DIRECTORY_PAGE_SIZE));
  const pageEntries = entries.slice(0, DIRECTORY_PAGE_SIZE);
  const selected = (user ? pageEntries.find((entry: DirectoryEntry) => entry.userId === user.id) : undefined) ?? null;

  const groups: FilterGroup[] = [
    {
      key: "tipo",
      label: "Tipo de miembro",
      activeLabel: current.tipo,
      options: [
        { label: "Todos los miembros", href: href({ tipo: undefined }), active: !current.tipo },
        ...DIRECTORY_ROLES.map((role) => ({ label: DIRECTORY_ROLE_PLURALS[role], href: href({ tipo: role }), active: current.tipo === role })),
      ],
    },
    {
      key: "area",
      label: "Área de asesoría",
      activeLabel: areas.find((a) => a.slug === current.area)?.name,
      options: [
        { label: "Todas las áreas", href: href({ area: undefined }), active: !current.area },
        ...areas.map((area) => ({ label: area.name, href: href({ area: area.slug }), active: current.area === area.slug })),
      ],
    },
    {
      key: "modelo",
      label: "Modelo de negocio",
      activeLabel: current.modelo ? BUSINESS_MODEL_LABELS[current.modelo] : undefined,
      options: [
        { label: "Cualquier modelo", href: href({ modelo: undefined }), active: !current.modelo },
        ...(["b2b", "b2c", "both"] as const).map((m) => ({ label: BUSINESS_MODEL_LABELS[m], href: href({ modelo: m }), active: current.modelo === m })),
      ],
    },
    {
      key: "alianza",
      label: "Alianza (empresas)",
      activeLabel: current.alianza ? (current.alianza === "active" ? ALLIANCE_LABELS.active : ALLIANCE_LABELS.intention) : undefined,
      options: [
        { label: "Todos los estados", href: href({ alianza: undefined }), active: !current.alianza },
        ...(["active", "intention"] as const).map((a) => ({ label: ALLIANCE_LABELS[a], href: href({ alianza: a }), active: current.alianza === a })),
      ],
    },
    {
      key: "sector",
      label: "Sector",
      activeLabel: sectors.find((s) => s.slug === current.sector)?.name,
      options: [
        { label: "Todos los sectores", href: href({ sector: undefined }), active: !current.sector },
        ...sectors.map((s) => ({ label: s.name, href: href({ sector: s.slug }), active: current.sector === s.slug })),
      ],
    },
  ];

  return (
    <>
      <div className="mt-4">
        <FilterBar groups={groups} clearHref={hasFilters ? "/directorio" : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-label="Listado del directorio" className="min-w-0 space-y-4 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2">
          <p className="text-sm font-medium text-unis-gray">
            {entries.length} {entries.length === 1 ? "miembro encontrado" : "miembros encontrados"}
          </p>

          {pageEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-unis-lightgray px-6 py-14 text-center">
              <h2 className="text-base font-semibold text-unis-text">
                {hasFilters ? "No hay miembros con estos filtros" : "El directorio aún está vacío"}
              </h2>
              <p className="mt-2 text-sm text-unis-gray">
                {hasFilters
                  ? "Prueba quitando algún filtro para ver más resultados."
                  : "Los miembros aparecen aquí cuando su cuenta esté activa y activan su perfil del directorio desde Mi cuenta."}
              </p>
            </div>
          ) : (
            <>
              {pageEntries.map((entry) => (
                <DirectoryCard key={entry.id} entry={entry} href={href({ ver: entry.id })} active={entry.id === selected?.id} />
              ))}
              <Pagination label="Paginación del directorio" currentPage={1} totalPages={totalPages} hrefFor={(p) => href({ page: p > 1 ? String(p) : undefined })} />
            </>
          )}
        </section>

        <section
          aria-label="Detalle del miembro del directorio"
          className="min-w-0 rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-6 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
        >
          {selected ? (
            <MemberDetail entry={selected} nextPath="/directorio" signedIn={Boolean(user)} actions={{ toggleSavedAction: toggleSaved, toggleHiddenAction: toggleHidden, reportAction: reportItem.bind(null, "publication", selected?.id ?? "") }} />
          ) : (
            <p className="py-16 text-center text-sm text-unis-gray">Selecciona un miembro de la lista para ver sus detalles.</p>
          )}
        </section>
      </div>
    </>
  );
}
