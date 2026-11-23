import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import Badge from "../ui/badge";
import { formatDate, formatDateTime } from "../../lib/dates";
import { NEWS_TYPE_LABELS, isNewsType } from "../../lib/news";

export type NewsCardItem = {
  slug: string;
  type: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  publishedAt: Date | null;
  eventStartsAt: Date | null;
  eventLocation: string | null;
};

/** Tarjeta de noticia, comunicado o evento para el listado público. */
export default function NewsCard({ item }: { item: NewsCardItem }) {
  const label = isNewsType(item.type) ? NEWS_TYPE_LABELS[item.type] : "Noticia";
  const isEvent = item.type === "event" && item.eventStartsAt;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-unis-lightgray bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-unis-cyan hover:shadow-md">
      <Link href={`/noticias/${item.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-unis-cyan/20 to-unis-blue/20">
          {item.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.coverUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <span aria-hidden="true" className="flex h-full items-center justify-center text-4xl font-black text-unis-red/30">
              {label.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={item.type === "event" ? "blue" : "neutral"}>{label}</Badge>
          </div>
          <h2 className="mt-3 text-lg font-bold leading-snug text-unis-text group-hover:text-unis-red">{item.title}</h2>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-unis-gray">{item.summary}</p>

          <div className="mt-4 space-y-1 text-xs text-unis-gray">
            {isEvent && item.eventStartsAt ? (
              <p className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-unis-cyan" aria-hidden="true" />
                {formatDateTime(item.eventStartsAt)}
              </p>
            ) : item.publishedAt ? (
              <p className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-unis-cyan" aria-hidden="true" />
                {formatDate(item.publishedAt)}
              </p>
            ) : null}
            {isEvent && item.eventLocation ? (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-unis-cyan" aria-hidden="true" />
                {item.eventLocation}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
