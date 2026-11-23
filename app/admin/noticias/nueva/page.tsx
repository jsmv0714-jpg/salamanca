import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "../../../../lib/permissions";
import NewsForm from "../news-form";
import { saveNews } from "../actions";

export default function NuevaNoticiaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <NuevaNoticiaContent />
      </Suspense>
    </div>
  );
}

async function NuevaNoticiaContent() {
  await requireAdmin("/admin/noticias/nueva");

  return (
    <>
      <Link href="/admin/noticias" className="text-sm font-medium text-unis-gray hover:text-unis-red">
        ← Volver a noticias y eventos
      </Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-unis-text">Nueva publicación</h1>
      <p className="mt-2 text-base text-unis-gray">Noticia, evento o comunicado para el portal de la institución.</p>

      <div className="mt-8">
        <NewsForm
          action={saveNews}
          defaults={{
            id: "",
            type: "news",
            title: "",
            summary: "",
            body: "",
            event_date: "",
            event_location: "",
            event_url: "",
            cover_url: null,
            published: false,
          }}
        />
      </div>
    </>
  );
}
