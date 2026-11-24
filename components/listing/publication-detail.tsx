import Link from "next/link";
import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import Badge from "../ui/badge";
import { MODALITY_LABELS, isModality } from "../../lib/publications";
import { formatDate, isPastDeadline } from "../../lib/dates";
import type { FormState } from "../../lib/validation";
import ItemActions from "./item-actions";

export type PublicationDetailData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  location: string | null;
  deadline: Date | null;
  modality: string | null;
  publishedAt: Date | null;
  typeName: string;
  authorName: string;
  coverUrl: string | null;
  careers: string[];
  sectors: string[];
  areas: string[];
};

type Actions = {
  toggleSavedAction: (formData: FormData) => Promise<void>;
  toggleHiddenAction: (formData: FormData) => Promise<void>;
  reportAction: (state: FormState, formData: FormData) => Promise<FormState>;
};

/** Panel de la derecha: resumen de la publicación seleccionada y sus acciones. */
export default function PublicationDetail({
  item,
  saved,
  hidden,
  nextPath,
  signedIn,
  actions,
}: {
  item: PublicationDetailData;
  saved: boolean;
  hidden: boolean;
  nextPath: string;
  signedIn: boolean;
  actions: Actions;
}) {
  const modality = isModality(item.modality) ? MODALITY_LABELS[item.modality] : null;
  const expired = isPastDeadline(item.deadline);

  return (
    <article className="space-y-8">
      {item.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.coverUrl} alt="" className="aspect-video w-full rounded-2xl object-cover" />
      ) : null}

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="blue">{item.typeName}</Badge>
          {modality ? <Badge>{modality}</Badge> : null}
          {hidden ? <Badge tone="amber">Oculta para ti</Badge> : null}
        </div>
        <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-unis-text">{item.title}</h2>
        <p className="mt-2 text-sm text-unis-gray">
          Publicado por <span className="font-semibold text-unis-text">{item.authorName}</span>
          {item.publishedAt ? ` · ${formatDate(item.publishedAt)}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-unis-gray">
          {item.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
              {item.location}
            </span>
          ) : null}
          {item.deadline ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
              {expired ? "Venció el" : "Hasta el"} {formatDate(item.deadline)}
            </span>
          ) : null}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-y border-unis-lightgray py-5">
        <Link
          href={`/publicaciones/${item.slug}`}
          className="inline-flex items-center justify-center rounded-full bg-unis-red px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
        >
          Aplicar
        </Link>
        <ItemActions
          kind="publication"
          id={item.id}
          nextPath={nextPath}
          sharePath={`/publicaciones/${item.slug}`}
          shareTitle={item.title}
          saved={saved}
          hidden={hidden}
          toggleSavedAction={actions.toggleSavedAction}
          toggleHiddenAction={actions.toggleHiddenAction}
          reportAction={actions.reportAction}
          signedIn={signedIn}
        />
      </div>

      <Section title="Descripción">
        <p className="whitespace-pre-line text-sm leading-relaxed text-unis-gray">{item.description}</p>
      </Section>

      {item.requirements ? (
        <Section title="Requisitos">
          <p className="whitespace-pre-line text-sm leading-relaxed text-unis-gray">{item.requirements}</p>
        </Section>
      ) : null}

      {item.benefits ? (
        <Section title="Beneficios">
          <p className="whitespace-pre-line text-sm leading-relaxed text-unis-gray">{item.benefits}</p>
        </Section>
      ) : null}

      {item.careers.length + item.sectors.length + item.areas.length > 0 ? (
        <Section title="Relación con el ecosistema">
          <div className="space-y-3">
            {[
              { title: "Carreras", items: item.careers },
              { title: "Sectores", items: item.sectors },
              { title: "Áreas de consultoría", items: item.areas },
            ]
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-unis-gray">{group.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.items.map((name) => (
                      <span key={name} className="rounded-md bg-unis-bg px-2.5 py-1 text-xs text-unis-gray ring-1 ring-inset ring-unis-lightgray">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </Section>
      ) : null}

      <Link href={`/publicaciones/${item.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-unis-red hover:underline">
        Ver ficha completa
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="flex items-center gap-3 text-base font-bold text-unis-text">
        <span aria-hidden="true" className="h-4 w-1 rounded-full bg-unis-cyan" />
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
