import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import { UUID_RE } from "../../../lib/validation";
import { ROLE_LABELS } from "../../../lib/roles";
import {
  AVAILABILITY_LABELS,
  SOCIAL_NETWORKS,
  copyFor,
  isProfileRole,
  readSocialLinks,
  safeHttpUrl,
} from "../../../lib/profile";
import { isDirectoryRole } from "../../../lib/ventures";
import Badge from "../../../components/ui/badge";
import Callout from "../../../components/ui/callout";
import TechBackground from "../../../components/ui/tech-background";
import {
  DetailBackLink,
  DetailFact,
  DetailHero,
  InfoCard,
  SectionTitle,
} from "../../../components/ui/detail-layout";

export default function PerfilPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="relative isolate overflow-hidden bg-unis-red">
      <TechBackground />
      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <DetailBackLink href="/directorio">Volver al directorio</DetailBackLink>
        <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
          <PerfilPublico params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function PerfilPublico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireUser(`/perfiles/${id}`);
  if (!UUID_RE.test(id)) notFound();

  const user = await prisma.users.findUnique({
    where: { id },
    include: {
      students: { include: { careers: true } },
      teachers: true,
      companies: { include: { sectors: true } },
      associations: { include: { sectors: true } },
      entrepreneurs: true,
      directory_profiles: { select: { id: true, is_visible: true } },
    },
  });

  const isSelf = viewer.id === id;
  const isAdmin = getUserRole(viewer) === "admin";
  if (!user || !isProfileRole(user.role) || user.status !== "active") notFound();
  if (!user.profile_public && !isSelf && !isAdmin) notFound();

  const role = user.role;
  const copy = copyFor(role);
  const links = readSocialLinks(user.social_links);
  const website = safeHttpUrl(user.website);
  const directoryId =
    user.directory_profiles?.is_visible && isDirectoryRole(role) ? user.directory_profiles.id : null;

  const facts: { label: string; value: string }[] = [];
  const add = (label: string, value: string | null | undefined) => {
    if (value) facts.push({ label, value });
  };
  if (role === "student") {
    add("Carrera", user.students?.careers?.name);
    add("Semestre", user.students?.semester);
    const availability = user.students?.availability;
    if (availability) add("Disponibilidad", AVAILABILITY_LABELS[availability]);
  }
  if (role === "teacher") {
    add("Cargo o título", user.teachers?.title);
    add("Departamento", user.teachers?.department);
    add("Grupo de investigación", user.teachers?.research_group_name);
  }
  if (role === "company") {
    add("Sector", user.companies?.sectors?.name);
  }
  if (role === "association") {
    add("Sector", user.associations?.sectors?.name);
  }
  if (role === "entrepreneur") {
    add("Proyecto", user.entrepreneurs?.project_name);
  }

  const portfolio = safeHttpUrl(user.students?.portfolio_url);
  const socialEntries = SOCIAL_NETWORKS.filter((n) => links[n.key]);
  const hasContact = Boolean(user.contact_email || user.phone || website || portfolio || socialEntries.length > 0);
  const hasFacts = facts.length > 0 || Boolean(portfolio);
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";
  const isLogo = role === "company" || role === "association";

  return (
    <article className="mt-6 rounded-3xl bg-white p-6 shadow-xl sm:p-10">
      {isSelf && !user.profile_public ? (
        <div className="mb-6">
          <Callout tone="info">
            Tu perfil no es visible para otros miembros. Actívalo en{" "}
            <Link href="/cuenta/perfil-profesional" className="font-semibold underline">
              tu perfil profesional
            </Link>{" "}
            cuando quieras.
          </Callout>
        </div>
      ) : null}

      <DetailHero>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={`${isLogo ? "Logo" : "Foto"} de ${user.name}`}
              className={`h-28 w-28 shrink-0 bg-white object-cover ring-1 ring-unis-lightgray ${isLogo ? "rounded-lg object-contain" : "rounded-full"}`}
            />
          ) : (
            <div
              aria-hidden="true"
              className={`flex h-28 w-28 shrink-0 items-center justify-center bg-unis-bg text-4xl font-black text-unis-red ${isLogo ? "rounded-lg" : "rounded-full"}`}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{ROLE_LABELS[role] ?? role}</Badge>
              {directoryId ? <Badge tone="blue">En el directorio</Badge> : null}
            </div>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-unis-text sm:text-4xl">
              {user.name || "Sin nombre"}
            </h1>
            {user.headline ? <p className="mt-2 text-lg text-unis-gray">{user.headline}</p> : null}
            {user.city ? (
              <div className="mt-4">
                <DetailFact icon={<MapPin />}>{user.city}</DetailFact>
              </div>
            ) : null}
          </div>
        </div>
      </DetailHero>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          {user.bio ? (
            <section>
              <SectionTitle>{copy.bio.label}</SectionTitle>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-unis-gray">{user.bio}</p>
            </section>
          ) : null}

          {user.skills.length > 0 ? (
            <section>
              <SectionTitle>{copy.skills.label}</SectionTitle>
              <ul className="mt-3 flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-md bg-unis-bg px-2.5 py-1 text-xs text-unis-gray ring-1 ring-inset ring-unis-lightgray"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {role === "association" && user.associations?.core_activity ? (
            <section>
              <SectionTitle>Actividad principal</SectionTitle>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-unis-gray">
                {user.associations.core_activity}
              </p>
            </section>
          ) : null}

          {directoryId ? (
            <p className="text-sm">
              <Link href={`/directorio/${directoryId}`} className="font-medium text-unis-red hover:underline">
                Ver mi ficha en el directorio
              </Link>
            </p>
          ) : null}

          {!user.bio && user.skills.length === 0 && !hasFacts && !hasContact ? (
            <p className="text-sm text-unis-gray">Esta persona todavía no ha completado su perfil.</p>
          ) : null}
        </div>

        <aside className="space-y-6 md:col-span-1 md:self-start">
          {hasFacts ? (
            <InfoCard title="Datos">
              <dl className="space-y-3 text-sm">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-unis-gray">{fact.label}</dt>
                    <dd className="text-unis-text">{fact.value}</dd>
                  </div>
                ))}
                {portfolio ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-unis-gray">Portafolio</dt>
                    <dd>
                      <a href={portfolio} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
                        Ver portafolio
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </InfoCard>
          ) : null}

          {hasContact ? (
            <InfoCard title="Contacto">
              <ul className="space-y-2 text-sm">
                {user.contact_email ? (
                  <li>
                    <a href={`mailto:${user.contact_email}`} className="font-medium text-unis-red hover:underline">
                      {user.contact_email}
                    </a>
                  </li>
                ) : null}
                {user.phone ? <li className="text-unis-text">{user.phone}</li> : null}
                {website ? (
                  <li>
                    <a href={website} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
                      Sitio web
                    </a>
                  </li>
                ) : null}
                {socialEntries.map((network) => (
                  <li key={network.key}>
                    <a
                      href={links[network.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-unis-red hover:underline"
                    >
                      {network.label}
                    </a>
                  </li>
                ))}
              </ul>
            </InfoCard>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
