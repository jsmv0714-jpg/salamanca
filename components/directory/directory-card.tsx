import Link from "next/link";
import Avatar from "../ui/avatar";
import Badge from "../ui/badge";
import type { DirectoryEntry } from "../../lib/directory";
import {
  ALLIANCE_LABELS,
  BUSINESS_MODEL_LABELS,
  DIRECTORY_ROLE_LABELS,
} from "../../lib/ventures";

export default function DirectoryCard({ entry }: { entry: DirectoryEntry }) {
  const place = [entry.sector, entry.city].filter(Boolean).join(" · ");
  const summary = entry.headline ?? entry.coreExpertise;

  return (
    <Link
      href={`/directorio/${entry.id}`}
      className="flex gap-4 rounded-lg border border-unis-lightgray bg-white p-5 shadow-sm transition hover:border-unis-red hover:shadow-md"
    >
      <Avatar name={entry.name} logoUrl={entry.logoUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{DIRECTORY_ROLE_LABELS[entry.role]}</Badge>
          {entry.allianceStatus && ALLIANCE_LABELS[entry.allianceStatus] ? (
            <Badge tone="green">{ALLIANCE_LABELS[entry.allianceStatus]}</Badge>
          ) : null}
          {entry.businessModel ? <Badge tone="blue">{BUSINESS_MODEL_LABELS[entry.businessModel]}</Badge> : null}
        </div>
        <h3 className="mt-2 text-lg font-bold text-unis-text">{entry.name}</h3>
        {entry.subtitle ? <p className="text-sm text-unis-gray">{entry.subtitle}</p> : null}
        {summary ? <p className="mt-2 line-clamp-2 text-sm text-unis-gray">{summary}</p> : null}
        {place ? <p className="mt-2 text-xs text-unis-gray">{place}</p> : null}
        {entry.areas.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {entry.areas.slice(0, 4).map((area) => (
              <span
                key={area.slug}
                className="rounded-md bg-unis-bg px-2 py-0.5 text-xs text-unis-gray ring-1 ring-inset ring-unis-lightgray"
              >
                {area.name}
              </span>
            ))}
            {entry.areas.length > 4 ? (
              <span className="px-1 py-0.5 text-xs text-unis-gray">+{entry.areas.length - 4}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
