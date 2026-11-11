import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  CalendarDays,
  GraduationCap,
  Globe,
  Layers,
  Link2,
  Mail,
  MapPin,
  Phone,
  Rocket,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
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
import { formatDate } from "../../../lib/dates";
import Badge from "../../../components/ui/badge";
import Callout from "../../../components/ui/callout";
import Reveal from "../../../components/ui/reveal";
import TechBackground from "../../../components/ui/tech-background";
import { DetailBackLink, SectionTitle } from "../../../components/ui/detail-layout";

export default function PerfilPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto mt-24 h-96 max-w-5xl animate-pulse rounded-3xl bg-unis-bg" aria-busy="true" />}>
      <PerfilPublico params={params} />
    </Suspense>
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
  const socialEntries = SOCIAL_NETWORKS.filter((n) => links[n.key]);
  const website = safeHttpUrl(user.website);
  const portfolio = safeHttpUrl(user.students?.portfolio_url);
  const directoryId = user.directory_profiles?.is_visible && isDirectoryRole(role) ? user.directory_profiles.id : null;
  const isLogo = role === "company" || role === "association";
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";
  const availability = user.students?.availability ? AVAILABILITY_LABELS[user.students.availability] : null;

  const [publications, ventures] = await Promise.all([
    user.profile_public || isSelf
      ? prisma.publications.findMany({
          where: { user_id: id, status: "published" },
          orderBy: { published_at: "desc" },
          take: 4,
          select: { id: true, title: true, slug: true, published_at: true },
        })
      : Promise.resolve([]),
    user.profile_public || isSelf
      ? prisma.ventures.findMany({
          where: { user_id: id, status: "published" },
          orderBy: { published_at: "desc" },
          take: 4,
          select: { id: true, name: true, slug: true, published_at: true },
        })
      : Promise.resolve([]),
  ]);

  type Detail = { icon: LucideIcon; label: string; value: string };
  const details: Detail[] = [];
  const add = (icon: LucideIcon, label: string, value: string | null | undefined) => {
    if (value) details.push({ icon, label, value });
  };
  if (role === "student") {
    add(GraduationCap, "Carrera", user.students?.careers?.name);
    add(CalendarDays, "Semestre", user.students?.semester);
    add(Star, "Disponibilidad", availability);
  } else if (role === "teacher") {
    add(GraduationCap, "Cargo o título", user.teachers?.title);
    add(Building2, "Departamento", user.teachers?.department);
    add(Layers, "Grupo de investigación", user.teachers?.research_group_name);
  } else if (role === "company") {
    add(Building2, "Sector", user.companies?.sectors?.name);
    add(MapPin, "Dirección", user.companies?.address);
  } else if (role === "association") {
    add(Users, "Sector", user.associations?.sectors?.name);
    add(MapPin, "Dirección", user.associations?.address);
  } else if (role === "entrepreneur") {
    add(Rocket, "Proyecto", user.entrepreneurs?.project_name);
  }

  const roleSectionTitle: Record<string, string> = {
    student: "Formación",
    teacher: "Trayectoria académica",
    company: "La empresa",
    association: "La agremiación",
    entrepreneur: "Tu proyecto",
  };
  const roleIcons: Record<string, LucideIcon> = {
    student: GraduationCap,
    teacher: GraduationCap,
    company: Building2,
    association: Users,
    entrepreneur: Rocket,
  };
  const RoleIcon = roleIcons[role] ?? Sparkles;
  const hasContact = Boolean(user.contact_email || user.phone || website || portfolio || socialEntries.length > 0);
  const hasActivity = publications.length > 0 || ventures.length > 0;

  return (
    <>
      <div className="relative isolate overflow-hidden bg-unis-red">
        <TechBackground />
        <div className="relative mx-auto max-w-5xl px-4 pb-36 pt-8 sm:px-6 sm:pb-32 lg:px-8">
          <DetailBackLink href="/directorio">Volver al directorio</DetailBackLink>
        </div>
      </div>

      <div className="relative mx-auto -mt-16 max-w-5xl px-4 pb-16 sm:-mt-24 sm:px-6 lg:px-8">
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

        <Reveal>
          <article className="rounded-3xl border border-unis-lightgray bg-white p-6 shadow-xl sm:p-10">
            <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="-mt-16 shrink-0 sm:-mt-24">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={`${isLogo ? "Logo" : "Foto"} de ${user.name}`}
                      className={`h-32 w-32 bg-white object-cover shadow-lg ring-4 ring-white sm:h-40 sm:w-40 ${isLogo ? "rounded-2xl object-contain" : "rounded-full"}`}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className={`flex h-32 w-32 items-center justify-center bg-gradient-to-br from-unis-cyan/20 to-unis-blue/20 text-5xl font-black text-unis-red shadow-lg ring-4 ring-white sm:h-40 sm:w-40 ${isLogo ? "rounded-2xl" : "rounded-full"}`}
                    >
                      {initial}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{ROLE_LABELS[role] ?? role}</Badge>
                    {directoryId ? <Badge tone="blue">En el directorio</Badge> : null}
                    {availability ? <Badge tone="green">{availability}</Badge> : null}
                  </div>
                  <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-unis-text sm:text-4xl">
                    {user.name || "Sin nombre"}
                  </h1>
                  {user.headline ? <p className="mt-2 text-lg text-unis-gray">{user.headline}</p> : null}
                  {user.city ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-unis-gray">
                      <MapPin className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
                      {user.city}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                {user.contact_email ? (
                  <a
                    href={`mailto:${user.contact_email}`}
                    className="inline-flex items-center gap-2 rounded-full bg-unis-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    Contactar
                  </a>
                ) : null}
                {directoryId ? (
                  <Link
                    href={`/directorio/${directoryId}`}
                    className="inline-flex items-center gap-2 rounded-full border border-unis-lightgray px-5 py-2.5 text-sm font-semibold text-unis-red transition hover:border-unis-cyan"
                  >
                    Ver ficha del directorio
                  </Link>
                ) : null}
              </div>
            </header>

            <div className="mt-10 grid gap-10 lg:grid-cols-3">
              <div className="space-y-10 lg:col-span-2">
                {user.bio ? (
                  <Reveal delay={60}>
                    <section>
                      <SectionTitle>
                        <Sparkles className="h-5 w-5 text-unis-cyan" aria-hidden="true" />
                        {copy.bio.label}
                      </SectionTitle>
                      <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-unis-gray">{user.bio}</p>
                    </section>
                  </Reveal>
                ) : null}

                {user.skills.length > 0 ? (
                  <Reveal delay={120}>
                    <section>
                      <SectionTitle>
                        <Star className="h-5 w-5 text-unis-cyan" aria-hidden="true" />
                        {copy.skills.label}
                      </SectionTitle>
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {user.skills.map((skill) => (
                          <li
                            key={skill}
                            className="rounded-full bg-unis-cyan/10 px-3.5 py-1.5 text-sm font-medium text-unis-red ring-1 ring-inset ring-unis-cyan/30 transition hover:bg-unis-cyan/20"
                          >
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </Reveal>
                ) : null}

                {details.length > 0 || (role === "association" && user.associations?.core_activity) ? (
                  <Reveal delay={160}>
                    <section>
                      <SectionTitle>
                        <RoleIcon className="h-5 w-5 text-unis-cyan" aria-hidden="true" />
                        {roleSectionTitle[role] ?? "Datos"}
                      </SectionTitle>
                      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                        {details.map((detail) => (
                          <div key={detail.label} className="rounded-xl bg-unis-bg p-4 ring-1 ring-inset ring-unis-lightgray">
                            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-unis-gray">
                              <detail.icon className="h-3.5 w-3.5 text-unis-cyan" aria-hidden="true" />
                              {detail.label}
                            </dt>
                            <dd className="mt-1 font-medium text-unis-text">{detail.value}</dd>
                          </div>
                        ))}
                      </dl>
                      {role === "association" && user.associations?.core_activity ? (
                        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-unis-gray">
                          {user.associations.core_activity}
                        </p>
                      ) : null}
                    </section>
                  </Reveal>
                ) : null}

                {hasActivity ? (
                  <Reveal delay={200}>
                    <section>
                      <SectionTitle>
                        <Layers className="h-5 w-5 text-unis-cyan" aria-hidden="true" />
                        Actividad
                      </SectionTitle>
                      <ul className="mt-4 space-y-3">
                        {publications.map((publication) => (
                          <li key={publication.id}>
                            <Link
                              href={`/publicaciones/${publication.slug}`}
                              className="group flex items-center justify-between gap-4 rounded-xl border border-unis-lightgray p-4 transition hover:-translate-y-0.5 hover:border-unis-cyan hover:shadow-md"
                            >
                              <span className="min-w-0">
                                <span className="block text-xs font-semibold uppercase tracking-wide text-unis-cyan">Publicación</span>
                                <span className="mt-0.5 block truncate font-semibold text-unis-text group-hover:text-unis-red">{publication.title}</span>
                              </span>
                              {publication.published_at ? (
                                <span className="shrink-0 text-xs text-unis-gray">{formatDate(publication.published_at)}</span>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                        {ventures.map((venture) => (
                          <li key={venture.id}>
                            <Link
                              href={`/ventures/${venture.slug}`}
                              className="group flex items-center justify-between gap-4 rounded-xl border border-unis-lightgray p-4 transition hover:-translate-y-0.5 hover:border-unis-cyan hover:shadow-md"
                            >
                              <span className="min-w-0">
                                <span className="block text-xs font-semibold uppercase tracking-wide text-unis-cyan">Venture</span>
                                <span className="mt-0.5 block truncate font-semibold text-unis-text group-hover:text-unis-red">{venture.name}</span>
                              </span>
                              {venture.published_at ? (
                                <span className="shrink-0 text-xs text-unis-gray">{formatDate(venture.published_at)}</span>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </Reveal>
                ) : null}

                {!user.bio && user.skills.length === 0 && details.length === 0 && !hasContact && !hasActivity ? (
                  <p className="text-sm text-unis-gray">Esta persona todavía no ha completado su perfil.</p>
                ) : null}
              </div>

              <aside className="lg:sticky lg:top-6 lg:self-start">
                {hasContact ? (
                  <Reveal delay={100}>
                    <section className="rounded-2xl bg-unis-bg p-6 ring-1 ring-inset ring-unis-lightgray">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-unis-text">Contacto</h2>
                      <ul className="mt-4 space-y-3 text-sm">
                        {user.contact_email ? (
                          <ContactRow icon={Mail}>
                            <a href={`mailto:${user.contact_email}`} className="break-all font-medium text-unis-red hover:underline">
                              {user.contact_email}
                            </a>
                          </ContactRow>
                        ) : null}
                        {user.phone ? (
                          <ContactRow icon={Phone}>
                            <span className="text-unis-text">{user.phone}</span>
                          </ContactRow>
                        ) : null}
                        {website ? (
                          <ContactRow icon={Globe}>
                            <a href={website} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
                              Sitio web
                            </a>
                          </ContactRow>
                        ) : null}
                        {portfolio ? (
                          <ContactRow icon={Layers}>
                            <a href={portfolio} target="_blank" rel="noopener noreferrer" className="font-medium text-unis-red hover:underline">
                              Portafolio
                            </a>
                          </ContactRow>
                        ) : null}
                      </ul>

                      {socialEntries.length > 0 ? (
                        <>
                          <h3 className="mt-6 text-xs font-bold uppercase tracking-wide text-unis-gray">Redes</h3>
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {socialEntries.map((network) => (
                              <li key={network.key}>
                                <a
                                  href={links[network.key]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-unis-red ring-1 ring-inset ring-unis-lightgray transition hover:-translate-y-0.5 hover:ring-unis-cyan"
                                >
                                  <Link2 className="h-3.5 w-3.5 text-unis-cyan" aria-hidden="true" />
                                  {network.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </section>
                  </Reveal>
                ) : null}
              </aside>
            </div>
          </article>
        </Reveal>
      </div>
    </>
  );
}

function ContactRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-unis-cyan ring-1 ring-inset ring-unis-lightgray">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 pt-1">{children}</span>
    </li>
  );
}
