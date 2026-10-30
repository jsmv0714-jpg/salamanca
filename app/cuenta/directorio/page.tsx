import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { getUserRole, getUserStatus } from "../../../lib/permissions";
import { param } from "../../../lib/query";
import { isDirectoryRole } from "../../../lib/ventures";
import { FormNotice } from "../../../components/ui/form";
import DirectoryProfileForm from "./directory-profile-form";
import { saveDirectoryProfile } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

export default function MiPerfilDirectorioPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <MiPerfilDirectorioContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MiPerfilDirectorioContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser("/cuenta/directorio");
  const role = getUserRole(user);
  const status = getUserStatus(user);
  const params = await searchParams;

  if (!isDirectoryRole(role)) {
    return (
      <>
        <h1 className="text-3xl font-black tracking-tight text-unis-text">Perfil del directorio</h1>
        <p className="mt-3 text-sm text-unis-gray">
          El directorio lista empresas, agremiaciones, emprendedores y consultores senior. Tu tipo de cuenta no
          aparece en él.
        </p>
        <Link href="/cuenta" className="mt-6 inline-block text-sm font-medium text-unis-red hover:underline">
          Volver a mi cuenta
        </Link>
      </>
    );
  }

  const [profile, sectors, areas] = await Promise.all([
    prisma.directory_profiles.findUnique({
      where: { user_id: user.id },
      include: { directory_profile_areas: true },
    }),
    prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.areas_of_expertise.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const defaults = {
    display_name: profile?.display_name ?? "",
    headline: profile?.headline ?? "",
    core_expertise: profile?.core_expertise ?? "",
    business_model: profile?.business_model ?? "",
    sector_id: profile?.sector_id ?? "",
    city: profile?.city ?? "",
    website: profile?.website ?? "",
    linkedin_url: profile?.linkedin_url ?? "",
    logo_url: profile?.logo_url ?? "",
    contact_email: profile?.contact_email ?? "",
    is_visible: profile?.is_visible ?? false,
    area_ids: profile?.directory_profile_areas.map((a) => a.area_id) ?? [],
  };

  const isPublic = Boolean(profile?.is_visible) && status === "active";

  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-unis-text">Perfil del directorio</h1>
      <p className="mt-2 text-base text-unis-gray">
        Cuéntale al ecosistema qué haces y en qué puedes asesorar a otros miembros.
      </p>

      <div className="mt-6 space-y-3">
        {param(params.guardado) ? <FormNotice message="Perfil guardado." /> : null}
        {profile?.is_visible && status !== "active" ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tu perfil está marcado como visible, pero no aparecerá en el directorio hasta que tu cuenta esté activa.
          </div>
        ) : null}
        {isPublic && profile ? (
          <p className="text-sm">
            <Link href={`/directorio/${profile.id}`} className="font-medium text-unis-red hover:underline">
              Ver mi perfil público
            </Link>
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <DirectoryProfileForm action={saveDirectoryProfile} defaults={defaults} sectors={sectors} areas={areas} />
      </div>
    </>
  );
}
