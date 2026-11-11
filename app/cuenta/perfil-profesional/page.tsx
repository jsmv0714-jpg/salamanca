import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Eye, ExternalLink } from "lucide-react";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { getUserRole, getUserStatus } from "../../../lib/permissions";
import { param } from "../../../lib/query";
import { ROLE_LABELS } from "../../../lib/roles";
import { buildChecklist, isProfileRole, readSocialLinks } from "../../../lib/profile";
import { FormNotice } from "../../../components/ui/form";
import Callout from "../../../components/ui/callout";
import TechBackground from "../../../components/ui/tech-background";
import { DetailBackLink, SectionTitle } from "../../../components/ui/detail-layout";
import Reveal from "../../../components/ui/reveal";
import PhotoUploader from "./photo-uploader";
import ProfessionalProfileForm, { type ProfessionalDefaults } from "./profile-form";
import { saveProfessionalProfile } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

export default function PerfilProfesionalPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<div className="mx-auto mt-24 h-96 max-w-6xl animate-pulse rounded-2xl bg-unis-bg px-4" aria-busy="true" />}>
      <PerfilProfesionalContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PerfilProfesionalContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sessionUser = await requireUser("/cuenta/perfil-profesional");
  const params = await searchParams;
  const role = getUserRole(sessionUser);
  const status = getUserStatus(sessionUser);

  const [user, careers, sectors] = await Promise.all([
    prisma.users.findUnique({
      where: { id: sessionUser.id },
      include: { students: true, teachers: true, companies: true, associations: true, entrepreneurs: true },
    }),
    prisma.careers.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!user || !isProfileRole(role)) notFound();

  const links = readSocialLinks(user.social_links);
  const student = user.students;
  const teacher = user.teachers;
  const company = user.companies;
  const association = user.associations;
  const entrepreneur = user.entrepreneurs;

  const defaults: ProfessionalDefaults = {
    headline: user.headline ?? "",
    bio: user.bio ?? "",
    skills: user.skills.join(", "),
    city: user.city ?? "",
    phone: user.phone ?? "",
    website: user.website ?? "",
    contact_email: user.contact_email ?? "",
    social_linkedin: links.linkedin ?? "",
    social_instagram: links.instagram ?? "",
    social_facebook: links.facebook ?? "",
    social_x: links.x ?? "",
    profile_public: user.profile_public,
    career_id: student?.career_id ?? "",
    semester: student?.semester ?? "",
    availability: student?.availability ?? "",
    portfolio_url: student?.portfolio_url ?? "",
    title: teacher?.title ?? "",
    department: teacher?.department ?? "",
    research_group_name: teacher?.research_group_name ?? "",
    sector_id: company?.sector_id ?? association?.sector_id ?? "",
    address: company?.address ?? association?.address ?? "",
    core_activity: association?.core_activity ?? "",
    project_name: entrepreneur?.project_name ?? "",
  };

  const isLogo = role === "company" || role === "association";
  const checklist = buildChecklist({
    role,
    hasPhoto: Boolean(user.image),
    headline: user.headline,
    bio: user.bio,
    skillCount: user.skills.length,
    city: user.city,
    contactPhone: user.phone,
    contactEmail: user.contact_email,
    socialCount: Object.keys(links).length,
    roleValues: {
      career_id: defaults.career_id,
      semester: defaults.semester,
      title: defaults.title,
      sector_id: defaults.sector_id,
      project_name: defaults.project_name,
    },
  });
  const hasRoleSection = role !== "admin";
  const publicLink = user.profile_public && status === "active";

  return (
    <>
      <div className="relative isolate overflow-hidden bg-unis-red">
        <TechBackground />
        <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
          <DetailBackLink href="/cuenta">Volver a mi cuenta</DetailBackLink>
          <Reveal>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">Perfil profesional</h1>
            <p className="mt-2 max-w-2xl text-base text-white/80">
              Lo que ven otros miembros cuando decides mostrar tu perfil. Tu nombre y tu correo de acceso se editan en{" "}
              <Link href="/cuenta/perfil" className="font-semibold text-white underline underline-offset-4">
                Mi perfil
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </div>

      <div className="relative mx-auto -mt-20 grid max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-unis-lightgray bg-white p-6 shadow-lg">
            <div className="flex items-end justify-between">
              <p className="text-sm font-semibold text-unis-text">Tu perfil está al</p>
              <p className="text-3xl font-black text-unis-red tabular-nums">{checklist.percent}%</p>
            </div>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-unis-bg"
              role="progressbar"
              aria-valuenow={checklist.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Completitud del perfil"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-unis-cyan to-unis-blue transition-[width] duration-700"
                style={{ width: `${checklist.percent}%` }}
              />
            </div>
            <ul className="mt-5 space-y-2.5 text-sm">
              {checklist.items.map((item) => (
                <li key={item.key} className={`flex items-center gap-2.5 ${item.done ? "text-unis-gray" : "text-unis-text"}`}>
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-unis-cyan" aria-hidden="true" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-unis-lightgray" aria-hidden="true" />
                  )}
                  <span className={item.done ? "line-through decoration-unis-cyan/50" : ""}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Secciones del perfil" className="hidden rounded-2xl border border-unis-lightgray bg-white p-3 shadow-sm lg:block">
            <ul className="space-y-1 text-sm">
              {[
                { href: "#presentacion", label: "Presentación" },
                ...(hasRoleSection ? [{ href: "#perfil-rol", label: "Datos de tu rol" }] : []),
                { href: "#contacto", label: "Contacto" },
                { href: "#redes", label: "Redes sociales" },
                { href: "#visibilidad", label: "Visibilidad" },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="block rounded-lg px-3 py-2 font-medium text-unis-gray transition hover:bg-unis-cyan/10 hover:text-unis-red"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {publicLink ? (
            <Link
              href={`/perfiles/${user.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-unis-lightgray bg-white p-4 text-sm font-semibold text-unis-red shadow-sm transition hover:border-unis-cyan hover:shadow-md"
            >
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" aria-hidden="true" />
                Ver cómo me ven otros
              </span>
              <ExternalLink className="h-4 w-4 text-unis-gray" aria-hidden="true" />
            </Link>
          ) : null}
        </aside>

        <div className="min-w-0 space-y-6">
          <div className="space-y-3">
            {param(params.guardado) ? <FormNotice message="Perfil guardado." /> : null}
            {param(params.foto) === "quitada" ? <FormNotice message="Foto eliminada." /> : null}
            {status !== "active" ? (
              <Callout tone="info">
                Tu cuenta está pendiente de activación. Podrás editar tu perfil cuando un administrador la active.
              </Callout>
            ) : null}
          </div>

          <Reveal>
            <section className="rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm sm:p-8">
              <SectionTitle>{isLogo ? "Logo" : "Foto de perfil"}</SectionTitle>
              <p className="mt-1 pl-4 text-sm text-unis-gray">
                {isLogo
                  ? "Acompaña tu ficha en el directorio y en tus publicaciones."
                  : "Ayuda a que te reconozcan en las postulaciones y en el directorio."}
              </p>
              <div className="mt-6">
                <PhotoUploader
                  currentUrl={user.image}
                  name={user.name}
                  roleLabel={ROLE_LABELS[role] ?? role}
                  isLogo={isLogo}
                />
              </div>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <ProfessionalProfileForm
              action={saveProfessionalProfile}
              defaults={defaults}
              role={role}
              careers={careers}
              sectors={sectors}
            />
          </Reveal>
        </div>
      </div>
    </>
  );
}
