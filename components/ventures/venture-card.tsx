import Link from "next/link";
import Avatar from "../ui/avatar";
import Badge from "../ui/badge";
import {
  BUSINESS_MODEL_LABELS,
  VENTURE_STATUS_LABELS,
  VENTURE_TYPE_LABELS,
  isBusinessModel,
  isVentureStatus,
  isVentureType,
} from "../../lib/ventures";

export type VentureCardData = {
  slug: string;
  name: string;
  type: string;
  tagline: string | null;
  trl_level: number;
  business_model: string;
  city: string | null;
  logo_url: string | null;
  status?: string;
  sectors: { name: string } | null;
};

export default function VentureCard({
  venture,
  showStatus = false,
}: {
  venture: VentureCardData;
  showStatus?: boolean;
}) {
  const typeLabel = isVentureType(venture.type) ? VENTURE_TYPE_LABELS[venture.type] : venture.type;
  const modelLabel = isBusinessModel(venture.business_model)
    ? BUSINESS_MODEL_LABELS[venture.business_model]
    : null;
  const statusLabel =
    showStatus && venture.status && isVentureStatus(venture.status)
      ? VENTURE_STATUS_LABELS[venture.status]
      : null;

  return (
    <Link
      href={`/ventures/${venture.slug}`}
      className="flex gap-4 rounded-2xl border border-unis-lightgray bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-unis-cyan hover:shadow-md"
    >
      <Avatar name={venture.name} logoUrl={venture.logo_url} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={venture.type === "spin_off" ? "blue" : "red"}>{typeLabel}</Badge>
          {statusLabel ? <Badge tone="amber">{statusLabel}</Badge> : null}
        </div>
        <h3 className="mt-2 text-lg font-bold text-unis-text">{venture.name}</h3>
        {venture.tagline ? (
          <p className="mt-1 line-clamp-2 text-sm text-unis-gray">{venture.tagline}</p>
        ) : null}
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-unis-gray">
          <span className="font-semibold text-unis-text">TRL {venture.trl_level}</span>
          {modelLabel ? <span>{modelLabel}</span> : null}
          {venture.sectors ? <span>{venture.sectors.name}</span> : null}
          {venture.city ? <span>{venture.city}</span> : null}
        </p>
      </div>
    </Link>
  );
}
