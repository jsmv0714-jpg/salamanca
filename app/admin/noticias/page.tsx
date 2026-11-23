import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/permissions";
import { param } from "../../../lib/query";
import { formatDate, formatDateTime } from "../../../lib/dates";
import { NEWS_TYPE_LABELS, isNewsType } from "../../../lib/news";
import Badge from "../../../components/ui/badge";
import { FormError, FormNotice, primaryButtonClass, secondaryButtonClass } from "../../../components/ui/form";
import ConfirmButton from "../../../components/ui/confirm-button";
import { deleteNews } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

const OK_MESSAGES: Record<string, string> = {
  publicada: "Noticia publicada. Los avisos por correo se están enviando.",
  guardada: "Borrador guardado.",
  eliminada: "Noticia eliminada.",
};

export default function AdminNoticiasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <AdminNoticiasContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminNoticiasContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin("/admin/noticias");
  const params = await searchParams;
  const ok = param(params.ok);
  const error = param(params.error);

  const items = await prisma.news.findMany({
    orderBy: { updated_at: "desc" },
    take: 200,
    select: {
      id: true,
      type: true,
      title: true,
      slug: true,
      status: true,
      published_at: true,
      event_starts_at: true,
      emails_sent_at: true,
      emails_sent_count: true,
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-unis-text">Noticias y eventos</h1>
          <p className="mt-2 text-base text-unis-gray">
            Lo que publiques aquí aparece en el portal público de noticias y se avisa por correo a las personas registradas.
          </p>
        </div>
        <Link href="/admin/noticias/nueva" className={primaryButtonClass}>
          Nueva publicación
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {ok && OK_MESSAGES[ok] ? <FormNotice message={OK_MESSAGES[ok]} /> : null}
        {error === "no-existe" ? <FormError message="Esa noticia ya no existe." /> : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-unis-lightgray py-14 text-center text-sm text-unis-gray">
          Todavía no hay noticias. Crea la primera con “Nueva publicación”.
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((item) => {
            const type = isNewsType(item.type) ? NEWS_TYPE_LABELS[item.type] : item.type;
            return (
              <li key={item.id} className="rounded-lg border border-unis-lightgray bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={item.type === "event" ? "blue" : "neutral"}>{type}</Badge>
                  <Badge tone={item.status === "published" ? "green" : "amber"}>
                    {item.status === "published" ? "Publicada" : "Borrador"}
                  </Badge>
                  {item.event_starts_at ? (
                    <span className="text-xs text-unis-gray">Evento: {formatDateTime(item.event_starts_at)}</span>
                  ) : null}
                </div>
                <h2 className="mt-2 text-lg font-bold text-unis-text">{item.title}</h2>
                <p className="mt-1 text-xs text-unis-gray">
                  {item.status === "published" && item.published_at
                    ? `Publicada el ${formatDate(item.published_at)}`
                    : "Sin publicar"}
                  {item.emails_sent_at
                    ? ` · Correos enviados: ${item.emails_sent_count}`
                    : item.status === "published"
                      ? " · Correos pendientes"
                      : ""}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link href={`/admin/noticias/${item.id}/editar`} className={secondaryButtonClass}>
                    Editar
                  </Link>
                  {item.status === "published" ? (
                    <Link href={`/noticias/${item.slug}`} className="text-sm font-medium text-unis-red hover:underline">
                      Ver en el portal
                    </Link>
                  ) : null}
                  <form action={deleteNews} className="ml-auto">
                    <input type="hidden" name="id" value={item.id} />
                    <ConfirmButton
                      message={`¿Eliminar “${item.title}”? Esta acción no se puede deshacer.`}
                      className="text-sm font-medium text-red-700 hover:underline"
                    >
                      Eliminar
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
