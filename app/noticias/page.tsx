import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "../../lib/prisma";
import { param, buildQuery, pageNumber } from "../../lib/query";
import { NEWS_PAGE_SIZE, NEWS_TYPE_LABELS, isNewsType, type NewsType } from "../../lib/news";
import { mediaPublicUrl } from "../../lib/storage";
import Pagination from "../../components/ui/pagination";
import NewsCard from "../../components/news/news-card";
import TechBackground from "../../components/ui/tech-background";
import Reveal from "../../components/ui/reveal";

type SearchParams = Record<string, string | string[] | undefined>;

const TABS: Array<{ value: NewsType | "todas"; label: string }> = [
  { value: "todas", label: "Todo" },
  { value: "news", label: "Noticias" },
  { value: "event", label: "Eventos" },
  { value: "announcement", label: "Comunicados" },
];

export const metadata = {
  title: "Noticias y eventos",
  description: "Noticias, comunicados y eventos de la Universidad de Salamanca y el Consultorio Empresarial Winner.",
};

export default function NoticiasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <div className="relative isolate overflow-hidden bg-unis-red">
        <TechBackground />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
          <Reveal>
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 ring-1 ring-inset ring-white/20">
              Portal institucional
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Noticias y eventos</h1>
            <p className="mt-2 max-w-2xl text-base text-white/80">
              Lo más reciente de la Universidad de Salamanca y del Consultorio Empresarial Winner: anuncios, comunicados y
              actividades para la comunidad.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="relative mx-auto -mt-12 max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-busy="true" />}>
          <NoticiasContent searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function NoticiasContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const params = await searchParams;
  const requested = param(params.tipo);
  const tipo: NewsType | "todas" = isNewsType(requested) ? requested : "todas";
  const page = pageNumber(param(params.pagina));
  const now = new Date();

  const where =
    tipo === "event"
      ? {
          status: "published" as const,
          type: "event" as const,
          // Los eventos aparecen hasta un día después de su hora de inicio.
          event_starts_at: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        }
      : {
          status: "published" as const,
          published_at: { lte: now },
          ...(tipo === "todas" ? {} : { type: tipo }),
        };

  const [total, items] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({
      where,
      orderBy: tipo === "event" ? { event_starts_at: "asc" } : { published_at: "desc" },
      skip: (page - 1) * NEWS_PAGE_SIZE,
      take: NEWS_PAGE_SIZE,
      select: {
        slug: true,
        type: true,
        title: true,
        summary: true,
        cover_key: true,
        published_at: true,
        event_starts_at: true,
        event_location: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE));
  const hrefFor = (target: number) => `/noticias${buildQuery({ tipo: tipo === "todas" ? undefined : tipo, pagina: target > 1 ? String(target) : undefined })}`;

  return (
    <>
      <nav aria-label="Filtrar por tipo" className="flex flex-wrap gap-2 rounded-2xl border border-unis-lightgray bg-white p-2 shadow-sm">
        {TABS.map((tab) => {
          const active = tab.value === tipo;
          return (
            <Link
              key={tab.value}
              href={`/noticias${tab.value === "todas" ? "" : `?tipo=${tab.value}`}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active ? "bg-unis-cyan/10 text-[#0A7F9E]" : "text-unis-gray hover:bg-unis-bg hover:text-unis-red"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-4 text-sm text-unis-gray">
        {tipo === "event"
          ? "Próximos eventos, en orden de fecha."
          : `Publicaciones más recientes${tipo === "todas" ? "" : ` · ${NEWS_TYPE_LABELS[tipo as NewsType]}s`}.`}
      </p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-unis-lightgray bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-base font-semibold text-unis-text">
            {tipo === "event" ? "No hay eventos próximos." : "Todavía no hay publicaciones aquí."}
          </p>
          <p className="mt-2 text-sm text-unis-gray">Vuelve pronto: el equipo publicará novedades de la institución.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.slug} delay={Math.min(index * 40, 200)}>
              <NewsCard
                item={{
                  slug: item.slug,
                  type: item.type,
                  title: item.title,
                  summary: item.summary,
                  coverUrl: item.cover_key ? mediaPublicUrl(item.cover_key) : null,
                  publishedAt: item.published_at,
                  eventStartsAt: item.event_starts_at,
                  eventLocation: item.event_location,
                }}
              />
            </Reveal>
          ))}
        </div>
      )}

      <Pagination label="Paginación de noticias" currentPage={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}
