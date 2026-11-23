import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import Markdown from "react-markdown";
import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { prisma } from "../../../lib/prisma";
import { formatDate, formatDateTime } from "../../../lib/dates";
import { NEWS_TYPE_LABELS, isNewsType } from "../../../lib/news";
import { mediaPublicUrl } from "../../../lib/storage";
import { safeHttpUrl } from "../../../lib/profile";
import Badge from "../../../components/ui/badge";
import TechBackground from "../../../components/ui/tech-background";
import Reveal from "../../../components/ui/reveal";
import { DetailBackLink } from "../../../components/ui/detail-layout";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const news = await prisma.news.findUnique({
    where: { slug },
    select: { title: true, summary: true, status: true, cover_key: true },
  });

  if (!news || news.status !== "published") return { title: "Noticia no encontrada" };

  return {
    title: news.title,
    description: news.summary,
    openGraph: {
      title: news.title,
      description: news.summary,
      ...(news.cover_key ? { images: [{ url: mediaPublicUrl(news.cover_key) }] } : {}),
    },
  };
}

export default function NoticiaPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<div className="mx-auto mt-24 h-96 max-w-3xl animate-pulse rounded-3xl bg-unis-bg" aria-busy="true" />}>
      <NoticiaContent params={params} />
    </Suspense>
  );
}

async function NoticiaContent({ params }: { params: Promise<Params> }) {
  await connection();
  const { slug } = await params;

  const news = await prisma.news.findUnique({ where: { slug } });
  if (!news || news.status !== "published" || !news.published_at || news.published_at > new Date()) notFound();

  const label = isNewsType(news.type) ? NEWS_TYPE_LABELS[news.type] : "Noticia";
  const isEvent = news.type === "event" && news.event_starts_at;
  const eventUrl = safeHttpUrl(news.event_url);
  const cover = news.cover_key ? mediaPublicUrl(news.cover_key) : null;

  return (
    <>
      <div className="relative isolate overflow-hidden bg-unis-red">
        <TechBackground />
        <div className="relative mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
          <DetailBackLink href="/noticias">Volver a noticias y eventos</DetailBackLink>
        </div>
      </div>

      <div className="relative mx-auto -mt-24 max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <Reveal>
          <article className="overflow-hidden rounded-3xl border border-unis-lightgray bg-white shadow-xl">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="aspect-video w-full object-cover" />
            ) : null}

            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={news.type === "event" ? "blue" : "neutral"}>{label}</Badge>
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-unis-text sm:text-4xl">{news.title}</h1>
              <p className="mt-3 text-lg leading-relaxed text-unis-gray">{news.summary}</p>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-unis-gray">
                {isEvent && news.event_starts_at ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
                    {formatDateTime(news.event_starts_at)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
                    {formatDate(news.published_at)}
                  </span>
                )}
                {isEvent && news.event_location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
                    {news.event_location}
                  </span>
                ) : null}
              </div>

              {isEvent && eventUrl ? (
                <a
                  href={eventUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-unis-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
                >
                  Inscribirme
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}

              <div className="mt-8 border-t border-unis-lightgray pt-8 text-[15px] leading-relaxed text-unis-gray [&_a]:font-medium [&_a]:text-unis-red [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-unis-cyan [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-unis-text [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-unis-text [&_li]:mt-1 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_strong]:font-semibold [&_strong]:text-unis-text [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6">
                <Markdown>{news.body}</Markdown>
              </div>
            </div>
          </article>
        </Reveal>

        <p className="mt-8 text-center text-sm">
          <Link href="/noticias" className="font-medium text-unis-red hover:underline">
            Ver más noticias y eventos
          </Link>
        </p>
      </div>
    </>
  );
}
