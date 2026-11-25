import Link from "next/link";
import { EyeOff, Heart, Save } from "lucide-react";
import Avatar from "../ui/avatar";
import {
  BUSINESS_MODEL_LABELS,
  VENTURE_TYPE_LABELS,
  isBusinessModel,
  isVentureType,
} from "../../lib/ventures";
import { relativeTime } from "../../lib/dates";

export type VentureCardData = {
  slug: string;
  name: string;
  type: string;
  tagline: string | null;
  trl_level: number;
  business_model: string;
  city: string | null;
  logo_url: string | null;
  published_at: Date | null;
  status?: string;
  sectors: { name: string } | null;
  saved?: boolean;
  hidden?: boolean;
};

/** Tarjeta de la lista de la izquierda: al pulsarla se muestra el panel de la derecha. */
export default function VentureCard({
  venture,
  href = `/ventures/${venture.slug}`,
  active = false,
  saved = false,
  hidden = false,
  showStatus = false,
}: {
  venture: VentureCardData;
  href?: string;
  active?: boolean;
  saved?: boolean;
  hidden?: boolean;
  showStatus?: boolean;
}) {
  const typeLabel = isVentureType(venture.type) ? VENTURE_TYPE_LABELS[venture.type] : venture.type;
  const modelLabel = isBusinessModel(venture.business_model) ? BUSINESS_MODEL_LABELS[venture.business_model] : null;

  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      aria-label={`${typeLabel}: ${venture.name}`}
      className={`block rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        active ? "border-unis-red ring-1 ring-unis-red/20" : "border-unis-lightgray hover:border-unis-cyan/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-4">
          <Avatar name={venture.name} logoUrl={venture.logo_url} size="lg" />
          <div className="min-w-0">
            <h3 className="font-bold leading-tight text-unis-text">{venture.name}</h3>
            {venture.tagline ? (
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-unis-text">{venture.tagline}</p>
            ) : null}
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-unis-gray">
              <span className="inline-flex items-center gap-1">
                <Heart className={`h-3.5 w-3.5 ${saved ? "fill-unis-red text-unis-red" : "text-unis-gray"}`} aria-hidden="true" />
                {saved ? "Guardada" : null}
              </span>
              <span className="font-semibold text-unis-text">TRL {venture.trl_level}</span>
              {modelLabel ? <span>{modelLabel}</span> : null}
              {venture.sectors ? <span>{venture.sectors.name}</span> : null}
              {venture.city ? <span>{venture.city}</span> : null}
              {venture.published_at ? <span>· {relativeTime(venture.published_at)}</span> : null}
              {showStatus && venture.status ? <span className="font-semibold text-unis-text">{venture.status}</span> : null}
            </p>
          </div>
        </div>

        {saved ? <Save className="mt-1 h-4 w-4 shrink-0 text-unis-red" aria-label="Guardada" /> : null}
        {hidden ? <EyeOff className="mt-1 h-4 w-4 shrink-0 text-unis-red/70" aria-label="Oculta" /> : null}
      </div>
    </Link>
  );
}
