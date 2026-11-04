import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { getUserRole, getUserStatus } from "../../../lib/permissions";
import { isAuthorRole } from "../../../lib/publications";
import Callout from "../../../components/ui/callout";
import PublicationForm, { type PublicationFormDefaults } from "../../../components/publications/publication-form";
import { createPublication } from "../actions";

export default function NuevaPublicacionPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <NuevaPublicacionContent />
      </Suspense>
    </div>
  );
}

async function NuevaPublicacionContent() {
  const user = await requireUser("/publicaciones/nueva");
  const role = getUserRole(user);

  if (!isAuthorRole(role)) {
    return (
      <>
        <h1 className="text-3xl font-black tracking-tight text-unis-text">Crear una publicación</h1>
        <p className="mt-3 text-sm text-unis-gray">
          Las publicaciones las crean las empresas, agremiaciones y emprendedores. Tu tipo de cuenta no puede
          publicar, pero sí puede postularse a las ofertas.
        </p>
        <Link href="/publicaciones" className="mt-6 inline-block text-sm font-medium text-unis-red hover:underline">
          Ver publicaciones
        </Link>
      </>
    );
  }

  if (getUserStatus(user) !== "active") {
    return (
      <>
        <h1 className="text-3xl font-black tracking-tight text-unis-text">Crear una publicación</h1>
        <div className="mt-4">
          <Callout tone="warning">
            Tu cuenta aún no está activa. Cuando un administrador la active podrás publicar.
          </Callout>
        </div>
        <Link href="/cuenta" className="mt-6 inline-block text-sm font-medium text-unis-red hover:underline">
          Volver a mi cuenta
        </Link>
      </>
    );
  }

  const [types, sectors, careers, areas] = await Promise.all([
    prisma.publication_types.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.careers.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.areas_of_expertise.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const defaults: PublicationFormDefaults = {
    publication_type_id: types[0]?.id ?? "",
    title: "",
    description: "",
    requirements: "",
    benefits: "",
    location: "",
    modality: "",
    deadline: "",
    contact_email: "",
    contact_phone: "",
    show_contact: true,
    sector_ids: [],
    career_ids: [],
    area_ids: [],
  };

  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-unis-text">Crear una publicación</h1>
      <p className="mt-2 text-base text-unis-gray">
        Ofrece prácticas, publica un servicio o solicita apoyo de otros miembros del ecosistema.
      </p>
      <div className="mt-8">
        <PublicationForm
          action={createPublication}
          defaults={defaults}
          types={types}
          sectors={sectors}
          careers={careers}
          areas={areas}
          mode="create"
          cancelHref="/cuenta/publicaciones"
        />
      </div>
    </>
  );
}
