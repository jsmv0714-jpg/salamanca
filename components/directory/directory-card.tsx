import Link from "next/link";
import Avatar from "../ui/avatar";
import Badge from "../ui/badge";
import { DIRECTORY_ROLE_LABELS } from "../../lib/ventures";

export default function DirectoryCard({
  entry,
  href,
  active,
}: {
  entry: {
    id: string;
    name: string;
    logoUrl: string | null;
    role: string;
    headline: string | null;
    coreExpertise: string | null;
    sector: string | null;
    city: string | null;
    skills: string[];
  };
  href: string;
  active?: boolean;
}) {
  const summary = entry.headline ?? entry.coreExpertise;
  const place = [entry.sector, entry.city].filter(Boolean).join(" · ");

  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`block rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        active ? "border-unis-red ring-1 ring-unis-red/20" : "border-unis-lightgray hover:border-unis-cyan/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-4">
          <Avatar name={entry.name} logoUrl={entry.logoUrl} size="lg" />
          <div className="min-w-0">
            <h3 className="font-bold leading-tight text-unis-text">{entry.name}</h3>
            {summary ? <p className="mt-1 line-clamp-2 text-sm font-semibold text-unis-text">{summary}</p> : null}
            {place ? <p className="mt-2 text-sm text-unis-gray">{place}</p> : null}
          </div>
        </div>
        <Badge tone="neutral">{(DIRECTORY_ROLE_LABELS as Record<string, string>)[entry.role]}</Badge>
      </div>
      {entry.skills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {entry.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-unis-cyan/10 px-2.5 py-0.5 text-xs font-medium text-unis-red ring-1 ring-inset ring-unis-cyan/30"
            >
              {skill}
            </span>
          ))}
          {entry.skills.length > 5 ? (
            <span className="px-2.5 py-0.5 text-xs text-unis-gray">+{entry.skills.length - 5}</span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
