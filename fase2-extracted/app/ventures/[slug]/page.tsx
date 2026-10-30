import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import {
  BUSINESS_MODEL_LABELS,
  SERVICE_STAGES,
  VENTURE_STATUS_LABELS,
  VENTURE_TYPE_LABELS,
  isBusinessModel,
  isVentureStatus,
  isVentureType,
} from "../../../lib/ventures";
import Avatar from "../../../components/ui/avatar";
import Badge from "../../../components/ui/badge";
import { secondaryButtonClass } from "../../../components/ui/form";
import TrlMeter from "../../../components/ventures/trl-meter";

export default function VentureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/ventures" className="text-sm font-medium text-unis-gray hover:text-unis-red">
          ← Volver a ventures
        </Link>
        <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
          <VentureDetail params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function VentureDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [venture, user] = await Promise.all([
    prisma.ventures.findUnique({
      where: { slug },
      include: {
        sectors: true,
        venture_areas: { include: { areas_of_expertise: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!venture) notFound();

  const isOwner = user?.id === venture.user_id;
  const isAdmin = getUserRole(user) === "admin";
  if (venture.status !== "published" && !isOwner && !isAdmin) notFound();

  // Quien la creó solo se muestra si decidió tener un perfil público en el directorio.
  const ownerProfile =
    venture.status === "published"
      ? await prisma.directory_profiles.findFirst({
          where: { user_id: venture.user_id, is_visible: true, users: { status: "active" } },
          select: { id: true, display_name: true, users: { select: { name: true } } },
        })
      : null;

  const typeLabel = isVentureType(venture.type) ? VENTURE_TYPE_LABELS[venture.type] : venture.type;
  const modelLabel = isBusinessModel(venture.business_model)
    ? BUSINESS_MODEL_LABELS[venture.business_model]
    : null;
  const statusLabel = isVentureStatus(venture.status) ? VENTURE_STATUS_LABELS[venture.status] : venture.status;
  const areas = venture.venture_areas.map((a) => a.areas_of_expertise.name).sort((a, b) => a.localeCompare(b, "es"));
  const stageName = venture.service_stage ? SERVICE_STAGES[venture.service_stage - 1] : null;
  const hasContact = venture.website || venture.linkedin_url || venture.contact_email;

  return (
    <article className="mt-6">
      {venture.status !== "published" ? (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Estado: {statusLabel}</p>
          <p className="mt-1">
            {venture.status === "draft" && "Solo tú puedes ver este borrador. Envíala a revisión cuando esté lista."}
            {venture.status === "in_review" && "Un administrador la está revisando. Aún no es pública."}
            {venture.status === "rejected" &&
              `No fue aprobada${venture.rejection_reason ? `: ${venture.rejection_reason}` : "."} Puedes corregirla y enviarla de nuevo.`}
          </p>
        </div>
      ) : null}

      <header className="flex gap-5">
        <Avatar name={venture.name} logoUrl={venture.logo_url} size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={venture.type === "spin_off" ? "blue" : "red"}>{typeLabel}</Badge>
            {modelLabel ? <Badge tone="neutral">{modelLabel}</Badge> : null}
            {venture.sectors ? <Badge tone="neutral">{venture.sectors.name}</Badge> : null}
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-unis-text">{venture.name}</h1>
          {venture.tagline ? <p className="mt-1 text-lg text-unis-gray">{venture.tagline}</p> : null}
          {venture.city ? <p className="mt-1 text-sm text-unis-gray">{venture.city}</p> : null}
        </div>
      </header>

      {isOwner || isAdmin ? (
        <div className="mt-5">
          <Link href={`/ventures/${venture.slug}/editar`} className={secondaryButtonClass}>
            Editar venture
          </Link>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          <section>
            <h2 className="text-lg font-bold text-unis-text">Qué es</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-unis-gray">{venture.description}</p>
          </section>

          {venture.type === "spin_off" && (venture.research_group || venture.senior_consultant) ? (
            <section>
              <h2 className="text-lg font-bold text-unis-text">Origen del conocimiento</h2>
              <dl className="mt-2 space-y-1 text-sm">
                {venture.research_group ? (
                  <div>
                    <dt className="inline font-medium text-unis-text">Grupo de investigación: </dt>
                    <dd className="inline text-unis-gray">{venture.research_group}</dd>
                  </div>
                ) : null}
                {venture.senior_consultant ? (
                  <div>
                    <dt className="inline font-medium text-unis-text">Consultor senior: </dt>
                    <dd className="inline text-unis-gray">{venture.senior_consultant}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          {areas.length > 0 ? (
            <section>
              <h2 className="text-lg font-bold text-unis-text">Áreas de consultoría</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {areas.map((area) => (
                  <span
                    key={area}
                    className="rounded-md bg-unis-bg px-2.5 py-1 text-xs text-unis-gray ring-1 ring-inset ring-unis-lightgray"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 md:col-span-1">
          <section className="rounded-lg border border-unis-lightgray bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-unis-text">Madurez</h2>
            <TrlMeter level={venture.trl_level} />
            {stageName ? (
              <p className="mt-4 text-xs text-unis-gray">
                Etapa del servicio Winner:{" "}
                <span className="font-semibold text-unis-text">
                  {venture.service_stage}. {stageName}
                </span>
              </p>
            ) : null}
          </section>

          {hasContact || ownerProfile ? (
            <section className="rounded-lg border border-unis-lightgray bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-unis-text">Contacto</h2>
              <ul className="space-y-2 text-sm">
                {venture.website ? (
                  <li>
                    <a href={venture.website} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
                      Sitio web
                    </a>
                  </li>
                ) : null}
                {venture.linkedin_url ? (
                  <li>
                    <a href={venture.linkedin_url} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
                      LinkedIn
                    </a>
                  </li>
                ) : null}
                {venture.contact_email ? (
                  <li>
                    <a href={`mailto:${venture.contact_email}`} className="font-medium text-unis-red hover:underline">
                      {venture.contact_email}
                    </a>
                  </li>
                ) : null}
                {ownerProfile ? (
                  <li className="border-t border-unis-lightgray pt-2 text-unis-gray">
                    Impulsada por{" "}
                    <Link href={`/directorio/${ownerProfile.id}`} className="font-medium text-unis-red hover:underline">
                      {ownerProfile.display_name || ownerProfile.users.name}
                    </Link>
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
