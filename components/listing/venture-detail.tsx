import Link from "next/link";
import { ArrowLeftRight, Check, Clock, ExternalLink, Link2, MapPin, type LucideIcon } from "lucide-react";
import Badge from "../ui/badge";
import { BUSINESS_MODEL_LABELS, TRL_PHASES, isBusinessModel, trlPhase } from "../../lib/ventures";
import { safeHttpUrl } from "../../lib/profile";
import { formatDate, formatDateTime } from "../../lib/dates";
import type { FormState } from "../../lib/validation";
import ItemActions from "./item-actions";

export type VentureDetailData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  type: string;
  trl_level: number;
  business_model: string;
  city: string | null;
  sectors: { name: string } | null;
  ownerName: string | null;
  ownerProfileLink: string | null;
  website: string | null;
  linkedinUrl: string | null;
  contactEmail: string | null;
  stage: number | null;
  publishedAt: Date | null;
};

type Actions = {
  toggleSavedAction: (formData: FormData) => Promise<void>;
  toggleHiddenAction: (formData: FormData) => Promise<void>;
  reportAction: (state: FormState, formData: FormData) => Promise<FormState>;
};

/** Panel de la derecha: resumen de la venture y sus acciones. */
export default function VentureDetail({
  item,
  saved,
  hidden,
  nextPath,
  signedIn,
  actions,
}: {
  item: VentureDetailData;
  saved: boolean;
  hidden: boolean;
  nextPath: string;
  signedIn: boolean;
  actions: Actions;
}) {
  const modelLabel = isBusinessModel(item.business_model) ? BUSINESS_MODEL_LABELS[item.business_model] : null;
  const phaseLabel = trlPhase(item.trl_level).label;
  const ownerUrl = item.ownerProfileLink ? safeHttpUrl(item.ownerProfileLink) : null;

  return (
    <article className="space-y-8">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={item.type === "spin_off" ? "blue" : "red"}>{item.type}</Badge>
          {modelLabel ? <Badge tone="neutral">{modelLabel}</Badge> : null}
          {item.sectors ? <Badge tone="neutral">{item.sectors.name}</Badge> : null}
          {hidden ? <Badge tone="amber">Oculta para ti</Badge> : null}
        </div>
        <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-unis-text">{item.name}</h2>
        {item.tagline ? <p className="mt-2 text-sm font-semibold text-unis-text">{item.tagline}</p> : null}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-unis-gray">
          <span className="flex items-center gap-1.5">
            <ArrowLeftRight className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
            {modelLabel ?? item.business_model}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
            TRL {item.trl_level} - {phaseLabel}
          </span>
          {item.publishedAt ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
              {formatDate(item.publishedAt)}
            </span>
          ) : null}
          {item.city ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
              {item.city}
            </span>
          ) : null}
          {ownerUrl ? (
            <a href={ownerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium text-unis-red hover:underline">
              Impulsada por {item.ownerName}
            </a>
          ) : (
            item.ownerName ? <span>Impulsada por {item.ownerName}</span> : null
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-y border-unis-lightgray py-5">
        <Link
          href={`/ventures/${item.slug}`}
          className="inline-flex items-center justify-center rounded-full bg-unis-red px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
        >
          Ver ficha completa
        </Link>
        <ItemActions
          kind="venture"
          id={item.id}
          nextPath={nextPath}
          sharePath={`/ventures/${item.slug}`}
          shareTitle={item.name}
          saved={saved}
          hidden={hidden}
          toggleSavedAction={actions.toggleSavedAction}
          toggleHiddenAction={actions.toggleHiddenAction}
          reportAction={actions.reportAction}
          signedIn={signedIn}
        />
      </div>

      <p className="text-sm leading-relaxed text-unis-gray">{item.description}</p>

      <Madurez trl={item.trl_level} />

      {item.website || item.linkedinUrl || item.contactEmail ? (
        <Section icon={Link2} title="Contacto">
          <ul className="mt-3 space-y-2 text-sm">
            {item.website ? (
              <li>
                <a href={item.website} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
                  Sitio web
                </a>
              </li>
            ) : null}
            {item.linkedinUrl ? (
              <li>
                <a href={item.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
                  LinkedIn
                </a>
              </li>
            ) : null}
            {item.contactEmail ? (
              <li>
                <a href={`mailto:${item.contactEmail}`} className="font-medium text-unis-red hover:underline">
                  {item.contactEmail}
                </a>
              </li>
            ) : null}
          </ul>
        </Section>
      ) : null}

      <Section icon={Check} title="En el ecosistema">
        <dl className="mt-3 space-y-3 text-sm">
          <div className="rounded-xl bg-unis-bg p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-unis-gray">Sector</dt>
            <dd className="mt-1 font-medium text-unis-text">{item.sectors?.name ?? "No especificado"}</dd>
          </div>
          <div className="rounded-xl bg-unis-bg p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-unis-gray">Ubicación</dt>
            <dd className="mt-1 font-medium text-unis-text">{item.city ?? "No especificada"}</dd>
          </div>
          {item.publishedAt ? (
            <div className="rounded-xl bg-unis-bg p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-unis-gray">Empujada</dt>
              <dd className="mt-1 text-sm text-unis-gray">{formatDateTime(item.publishedAt)}</dd>
            </div>
          ) : null}
        </dl>
        {item.ownerProfileLink ? (
          <a href={safeHttpUrl(item.ownerProfileLink) ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-unis-red hover:underline">
            Ver perfil de la impulsadora
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </Section>
    </article>
  );
}

function Madurez({ trl }: { trl: number }) {
  return (
    <section>
      <h3 className="flex items-center gap-3 text-base font-bold text-unis-text">
        <span className="flex h-4 w-1 items-center">
          <Clock className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
        </span>
        Madurez
      </h3>
      <p className="mt-3 text-3xl font-black text-unis-text tabular-nums">TRL {trl}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-unis-lightgray/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-unis-red/70 to-unis-red-dark"
          style={{ width: `${Math.max(20, percentOf(trl, 1, 9))}%` }}
        />
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-unis-gray">
        {TRL_PHASES.map((phase) => (
          <li key={phase.key} className="flex items-center gap-2">
            <span className={`h-1.5 w-8 rounded-full ${trl >= phase.min ? "bg-unis-red/60" : "bg-unis-lightgray"}`} />
            <span className={trl >= phase.min ? "font-semibold text-unis-text" : ""}>
              {phase.min}-{phase.max} · {phase.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function percentOf(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mt-8 flex items-center gap-3 text-base font-bold text-unis-text">
        <span className="flex h-4 w-1 items-center">
          <Icon className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}
