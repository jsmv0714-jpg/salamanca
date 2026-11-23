import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/permissions";
import { UUID_RE } from "../../../../../lib/validation";
import { mediaPublicUrl } from "../../../../../lib/storage";
import NewsForm from "../../news-form";
import { saveNews } from "../../actions";

export default function EditarNoticiaPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <EditarNoticiaContent params={params} />
      </Suspense>
    </div>
  );
}

async function EditarNoticiaContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/noticias/${id}/editar`);
  if (!UUID_RE.test(id)) notFound();

  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) notFound();

  // Hora de Colombia para el campo de fecha y hora ("AAAA-MM-DDTHH:mm").
  const eventDate = news.event_starts_at
    ? news.event_starts_at.toLocaleString("sv-SE", { timeZone: "America/Bogota" }).slice(0, 16).replace(" ", "T")
    : "";

  return (
    <>
      <Link href="/admin/noticias" className="text-sm font-medium text-unis-gray hover:text-unis-red">
        ← Volver a noticias y eventos
      </Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-unis-text">Editar publicación</h1>
      <p className="mt-2 text-base text-unis-gray">
        {news.status === "published" ? "Esta publicación está visible en el portal." : "Este borrador todavía no es visible."}
      </p>

      <div className="mt-8">
        <NewsForm
          action={saveNews}
          defaults={{
            id: news.id,
            type: news.type,
            title: news.title,
            summary: news.summary,
            body: news.body,
            event_date: eventDate,
            event_location: news.event_location ?? "",
            event_url: news.event_url ?? "",
            cover_url: news.cover_key ? mediaPublicUrl(news.cover_key) : null,
            published: news.status === "published",
          }}
        />
      </div>
    </>
  );
}
