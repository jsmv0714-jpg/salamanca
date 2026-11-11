import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { getUserRole, getUserStatus } from "../../../lib/permissions";
import { param } from "../../../lib/query";
import { ROLE_LABELS } from "../../../lib/roles";
import { isProfileRole, readSocialLinks } from "../../../lib/profile";
import { FormNotice } from "../../../components/ui/form";
import Callout from "../../../components/ui/callout";
import PhotoUploader from "./photo-uploader";
import ProfessionalProfileForm, { type ProfessionalDefaults } from "./profile-form";
import { saveProfessionalProfile } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

export default function PerfilProfesionalPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <PerfilProfesionalContent searchParams={searchParams} />
      </Suspense>
    </div>
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

  return (
    <>
      <Link href="/cuenta" className="text-sm font-medium text-unis-gray hover:text-unis-red">
        ← Volver a mi cuenta
      </Link>

      <h1 className="mt-3 text-3xl font-black tracking-tight text-unis-text">Perfil profesional</h1>
      <p className="mt-2 text-base text-unis-gray">
        Foto, presentación, habilidades y contacto. Tu nombre y tu correo de acceso se editan en{" "}
        <Link href="/cuenta/perfil" className="font-medium text-unis-red hover:underline">
          Mi perfil
        </Link>
        .
      </p>

      <div className="mt-6 space-y-3">
        {param(params.guardado) ? <FormNotice message="Perfil guardado." /> : null}
        {param(params.foto) === "quitada" ? <FormNotice message="Foto eliminada." /> : null}
        {status !== "active" ? (
          <Callout tone="info">
            Tu cuenta está pendiente de activación. Podrás editar tu perfil cuando un administrador la active.
          </Callout>
        ) : null}
        {user.profile_public && status === "active" ? (
          <p className="text-sm">
            <Link href={`/perfiles/${user.id}`} className="font-medium text-unis-red hover:underline">
              Ver cómo se ve mi perfil
            </Link>
          </p>
        ) : null}
      </div>

      <section className="mt-8 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">{isLogo ? "Logo" : "Foto de perfil"}</h2>
        <p className="mt-1 text-sm text-unis-gray">
          {isLogo
            ? "Es el logo que acompaña a tu ficha en el directorio y en tus publicaciones."
            : "Ayuda a que te reconozcan en las postulaciones y en el directorio."}
        </p>
        <div className="mt-5">
          <PhotoUploader
            currentUrl={user.image}
            name={user.name}
            roleLabel={ROLE_LABELS[role] ?? role}
            isLogo={isLogo}
          />
        </div>
      </section>

      <div className="mt-6">
        <ProfessionalProfileForm
          action={saveProfessionalProfile}
          defaults={defaults}
          role={role}
          careers={careers}
          sectors={sectors}
        />
      </div>
    </>
  );
}
