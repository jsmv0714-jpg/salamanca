import Link from "next/link";
import { CalendarDays, Heart, MapPin } from "lucide-react";
import Badge from "../ui/badge";
import { isModality, MODALITY_LABELS } from "../../lib/publications";
import { formatDate, relativeTime } from "../../lib/dates";

export type PublicationCardData = {
  slug: string;
  title: string;
  typeName: string;
  authorName: string;
  location: string | null;
  deadline: Date | null;
  publishedAt: Date | null;
  modality: string | null;
};

/** Tarjeta de la lista de la izquierda. Al pulsarla se muestra su detalle a la derecha. */
export default function PublicationCard({
  item,
  href,
  active,
  saved,
  hidden,
}: {
  item: PublicationCardData;
  href: string;
  active: boolean;
  saved: boolean;
  hidden: boolean;
}) {
  const modality = isModality(item.modality) ? MODALITY_LABELS[item.modality] : null;
  const expired = Boolean(item.deadline && new Date() > item.deadline);

  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`block rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        active ? "border-unis-red ring-1 ring-unis-red/20" : "border-unis-lightgray hover:border-unis-cyan/60"
      } ${hidden ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold leading-snug text-unis-text">{item.title}</h3>
        {saved ? <Heart className="mt-0.5 h-4 w-4 shrink-0 fill-unis-red text-unis-red" aria-label="Guardada" /> : null}
      </div>
      <p className="mt-1.5 text-sm font-medium text-unis-text">{item.authorName}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone="blue">{item.typeName}</Badge>
        {modality ? <Badge>{modality}</Badge> : null}
        {hidden ? <Badge tone="amber">Oculta</Badge> : null}
      </div>
      {item.location ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-unis-gray">
          <MapPin className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
          {item.location}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-unis-gray">
        <span>{item.publishedAt ? relativeTime(item.publishedAt) : ""}</span>
        {item.deadline ? (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {expired ? "Venció" : "Hasta"} {formatDate(item.deadline)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
