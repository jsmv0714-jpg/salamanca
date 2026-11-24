import Link from "next/link";
import { Building2, Check, Link2 } from "lucide-react";
import Badge from "../ui/badge";
import { DIRECTORY_ROLE_LABELS } from "../../lib/ventures";
import type { DirectoryEntry } from "../../lib/directory";
import { safeHttpUrl } from "../../lib/profile";
import type { FormState } from "../../lib/validation";
import ItemActions from "./item-actions";

type Actions = {
  toggleSavedAction: (formData: FormData) => Promise<void>;
  toggleHiddenAction: (formData: FormData) => Promise<void>;
  reportAction: (state: FormState, formData: FormData) => Promise<FormState>;
};

/** Panel de la derecha: resumen del miembro del directorio y sus acciones. */
export default function MemberDetail({
  entry,
  nextPath,
  signedIn,
  actions,
}: {
  entry: DirectoryEntry;
  nextPath: string;
  signedIn: boolean;
  actions: Actions;
}) {
  const summary = entry.headline ?? entry.coreExpertise;
  const socialEntries = entry.areas.slice(0, 5);

  return (
    <article className="space-y-8">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{DIRECTORY_ROLE_LABELS[entry.role]}</Badge>
        </div>
        <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-unis-text">{entry.name}</h2>
        {summary ? <p className="mt-2 text-sm font-semibold text-unis-text">{summary}</p> : null}
        {[entry.sector, entry.city].some(Boolean) ? (
          <p className="mt-4 flex flex-wrap gap-3 text-sm text-unis-gray">
            {[entry.sector, entry.city].filter(Boolean).map((value, index) => (
              <span key={index} className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
                {value}
              </span>
            ))}
          </p>
        ) : null}
      </header>

      {socialEntries.length > 0 ? (
        <Section icon={Link2} title="Redes sociales">
          <ul className="mt-3 flex flex-wrap gap-3">
            {socialEntries.map((area) => (
              <li key={area.slug}>
                <Link href={`/directorio?area=${area.slug}`} className="text-sm font-medium text-unis-red hover:underline">
                  {area.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {entry.skills.length > 0 ? (
        <Section icon={Check} title="Habilidades">
          <ul className="mt-3 flex flex-wrap gap-2">
            {entry.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full bg-unis-cyan/10 px-3 py-1 text-sm font-medium text-unis-red ring-1 ring-inset ring-unis-cyan/30"
              >
                {skill}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-unis-lightgray py-5">
        <Link
          href={`/directorio/${entry.id}`}
          className="inline-flex items-center justify-center rounded-full bg-unis-red px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
        >
          Ver ficha
        </Link>
        <ItemActions
          kind="publication"
          id={entry.id}
          nextPath={nextPath}
          sharePath={`/directorio/${entry.id}`}
          shareTitle={entry.name}
          saved={false}
          hidden={false}
          toggleSavedAction={actions.toggleSavedAction}
          toggleHiddenAction={actions.toggleHiddenAction}
          reportAction={actions.reportAction}
          signedIn={signedIn}
        />
      </div>

      {entry.website || entry.linkedinUrl || entry.contactEmail ? (
        <Section icon={Link2} title="Contacto">
          <ul className="mt-3 space-y-2 text-sm">
            {entry.website ? (
              <li>
                <a href={safeHttpUrl(entry.website) ?? undefined} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
                  Sitio web
                </a>
              </li>
            ) : null}
            {entry.linkedinUrl ? (
              <li>
                <a href={safeHttpUrl(entry.linkedinUrl) ?? undefined} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
                  LinkedIn
                </a>
              </li>
            ) : null}
            {entry.contactEmail ? (
              <li>
                <a href={`mailto:${entry.contactEmail}`} className="font-medium text-unis-red hover:underline">
                  {entry.contactEmail}
                </a>
              </li>
            ) : null}
          </ul>
        </Section>
      ) : null}
    </article>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Link2; title: string; children: React.ReactNode }) {
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
