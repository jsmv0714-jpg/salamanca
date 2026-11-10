import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { loadDirectoryEntry } from "../../../lib/directory";
import { ALLIANCE_LABELS, BUSINESS_MODEL_LABELS, DIRECTORY_ROLE_LABELS } from "../../../lib/ventures";
import { MapPin } from "lucide-react";
import Avatar from "../../../components/ui/avatar";
import Badge from "../../../components/ui/badge";
import {
  DetailBackLink,
  DetailFact,
  DetailHero,
  InfoCard,
  SectionTitle,
} from "../../../components/ui/detail-layout";
import VentureCard from "../../../components/ventures/venture-card";
import TechBackground from "../../../components/ui/tech-background";

export default function DirectorioDetallePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="relative isolate overflow-hidden bg-unis-red">
      <TechBackground />
      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <DetailBackLink href="/directorio">Volver al directorio</DetailBackLink>
        <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
          <DirectorioDetalle params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function DirectorioDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await loadDirectoryEntry(id);
  if (!entry) notFound();

  const ventures = await prisma.ventures.findMany({
    where: { user_id: entry.userId, status: "published" },
    include: { sectors: true },
    orderBy: { published_at: "desc" },
  });

  const hasContact = entry.website || entry.linkedinUrl || entry.contactEmail;

  return (
    <article className="mt-6 rounded-3xl bg-white p-6 shadow-xl sm:p-10">
      <DetailHero>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={entry.name} logoUrl={entry.logoUrl} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{DIRECTORY_ROLE_LABELS[entry.role]}</Badge>
              {entry.allianceStatus && ALLIANCE_LABELS[entry.allianceStatus] ? (
                <Badge tone="green">{ALLIANCE_LABELS[entry.allianceStatus]}</Badge>
              ) : null}
              {entry.businessModel ? <Badge tone="blue">{BUSINESS_MODEL_LABELS[entry.businessModel]}</Badge> : null}
            </div>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-unis-text sm:text-4xl">
              {entry.name}
            </h1>
            {entry.subtitle ? <p className="mt-2 text-base text-unis-gray">{entry.subtitle}</p> : null}
            {entry.headline ? <p className="mt-1 text-lg text-unis-gray">{entry.headline}</p> : null}
            {[entry.sector, entry.city].some(Boolean) ? (
              <div className="mt-4">
                <DetailFact icon={<MapPin />}>{[entry.sector, entry.city].filter(Boolean).join(" · ")}</DetailFact>
              </div>
            ) : null}
          </div>
        </div>
      </DetailHero>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          {entry.coreExpertise ? (
            <section>
              <SectionTitle>Core y asesoría</SectionTitle>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-unis-gray">{entry.coreExpertise}</p>
            </section>
          ) : null}

          {entry.areas.length > 0 ? (
            <section>
              <SectionTitle>Áreas en las que asesora</SectionTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.areas.map((area) => (
                  <Link
                    key={area.slug}
                    href={`/directorio?area=${area.slug}`}
                    className="rounded-md bg-unis-bg px-2.5 py-1 text-xs text-unis-gray ring-1 ring-inset ring-unis-lightgray hover:text-unis-red"
                  >
                    {area.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {ventures.length > 0 ? (
            <section>
              <SectionTitle>Ventures</SectionTitle>
              <div className="mt-3 grid gap-4">
                {ventures.map((venture) => (
                  <VentureCard key={venture.id} venture={venture} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {hasContact ? (
          <aside className="md:sticky md:top-6 md:col-span-1 md:self-start">
            <InfoCard title="Contacto">
              <ul className="space-y-2 text-sm">
                {entry.website ? (
                  <li>
                    <a href={entry.website} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
                      Sitio web
                    </a>
                  </li>
                ) : null}
                {entry.linkedinUrl ? (
                  <li>
                    <a href={entry.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
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
            </InfoCard>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
