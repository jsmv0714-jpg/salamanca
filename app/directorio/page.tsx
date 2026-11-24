import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/session";
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
  ver?: string;
  page?: string;
};

type DirectoryRoleFilter = "company" | "association" | "entrepreneur" | "teacher";
type BusinessModelFilter = "b2b" | "b2c" | "both";
type AllianceFilter = "active" | "intention";
type MemberMark = { saved: boolean; hidden: boolean };

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
  const tipoParam = param(raw.tipo);
  const modeloParam = param(raw.modelo);
  const alianzaParam = param(raw.alianza);
  const current: DirFiltersActive = {
    tipo: tipoParam && isDirectoryRole(tipoParam) ? (tipoParam as DirectoryRoleFilter) : undefined,
    sector: param(raw.sector),
    area: param(raw.area),
    modelo: modeloParam && isBusinessModel(modeloParam) ? (modeloParam as BusinessModelFilter) : undefined,
    alianza: alianzaParam === "active" || alianzaParam === "intention" ? (alianzaParam as AllianceFilter) : undefined,
    q: param(raw.q),
    ver: param(raw.ver),
    page: param(raw.page),
  };

  const filters: DirectoryFilters = {
    tipo: current.tipo,
    sector: current.sector,
    area: current.area,
    modelo: current.modelo,
    alianza: current.alianza,
    q: current.q,
  };

  const user = await getCurrentUser();
  const [entries, sectors, areas, marks] = await Promise.all([
    loadDirectory(filters),
    prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
    prisma.areas_of_expertise.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
    user
      ? prisma.directory_marks.findMany({
          where: { user_id: user.id },
          select: { directory_profile_id: true, saved: true, hidden: true },
        })
      : Promise.resolve([]),
  ]);

  const markMap = new Map<string, MemberMark>(
    marks.map((mark) => [mark.directory_profile_id, { saved: mark.saved, hidden: mark.hidden }])
  );
  const visibleEntries = entries.filter((entry) => !markMap.get(entry.id)?.hidden);
  const hasFilters = Boolean(current.tipo || current.sector || current.area || current.modelo || current.alianza || current.q);

  // Los enlaces de filtros limpian la selección y la página; las tarjetas y la paginación las restauran.
  const href = (overrides: Record<string, string | undefined>) =>
    `/directorio${buildQuery({ ...current, ver: undefined, page: undefined }, overrides)}`;

  const totalPages = Math.max(1, Math.ceil(visibleEntries.length / DIRECTORY_PAGE_SIZE));
  const selectedFromUrl = current.ver ? visibleEntries.find((entry) => entry.id === current.ver) ?? null : null;
  const effectivePage = selectedFromUrl
    ? Math.floor(visibleEntries.findIndex((entry) => entry.id === selectedFromUrl.id) / DIRECTORY_PAGE_SIZE) + 1
    : Math.min(pageNumber(current.page), totalPages);
  const pageEntries = visibleEntries.slice((effectivePage - 1) * DIRECTORY_PAGE_SIZE, effectivePage * DIRECTORY_PAGE_SIZE);
  const selected = selectedFromUrl ?? pageEntries[0] ?? null;
  const selectedMark = selected ? markMap.get(selected.id) ?? { saved: false, hidden: false } : { saved: false, hidden: false };
  const nextPath = selected
    ? href({ ver: selected.id, page: effectivePage > 1 ? String(effectivePage) : undefined })
    : "/directorio";

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
            {visibleEntries.length} {visibleEntries.length === 1 ? "miembro encontrado" : "miembros encontrados"}
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
              <Pagination
                label="Paginación del directorio"
                currentPage={effectivePage}
                totalPages={totalPages}
                hrefFor={(p) => href({ page: p > 1 ? String(p) : undefined, ver: selected?.id })}
              />
            </>
          )}
        </section>

        <section
          aria-label="Detalle del miembro del directorio"
          className="min-w-0 rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-6 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
        >
          {selected ? (
            <MemberDetail
              entry={selected}
              nextPath={nextPath}
              signedIn={Boolean(user)}
              saved={selectedMark.saved}
              hidden={selectedMark.hidden}
              actions={{
                toggleSavedAction: toggleSaved,
                toggleHiddenAction: toggleHidden,
                reportAction: reportItem.bind(null, "directory", selected.id),
              }}
            />
          ) : (
            <p className="py-16 text-center text-sm text-unis-gray">Selecciona un miembro de la lista para ver sus detalles.</p>
          )}
        </section>
      </div>
    </>
  );
}
