import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/session";
import { getUserRole } from "../../../../lib/permissions";
import { allowedVentureTypes, isBusinessModel, type VentureType } from "../../../../lib/ventures";
import VentureForm, { type VentureFormDefaults } from "../../../../components/ventures/venture-form";
import DeleteVentureButton from "../../../../components/ventures/delete-venture-button";
import { deleteVenture, updateVenture } from "../../actions";

export default function EditarVenturePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <EditarVentureContent params={params} />
      </Suspense>
    </div>
  );
}

async function EditarVentureContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/ventures/${slug}/editar`);
  const role = getUserRole(user);

  const venture = await prisma.ventures.findUnique({
    where: { slug },
    include: { venture_areas: true },
  });
  if (!venture || (venture.user_id !== user.id && role !== "admin")) notFound();

  const [sectors, areas] = await Promise.all([
    prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.areas_of_expertise.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const allowedTypes = Array.from(new Set<VentureType>([...allowedVentureTypes(role), venture.type]));

  const defaults: VentureFormDefaults = {
    type: venture.type,
    name: venture.name,
    tagline: venture.tagline ?? "",
    description: venture.description,
    sector_id: venture.sector_id ?? "",
    business_model: isBusinessModel(venture.business_model) ? venture.business_model : "both",
    trl_level: String(venture.trl_level),
    service_stage: venture.service_stage ? String(venture.service_stage) : "",
    research_group: venture.research_group ?? "",
    senior_consultant: venture.senior_consultant ?? "",
    city: venture.city ?? "",
    logo_url: venture.logo_url ?? "",
    website: venture.website ?? "",
    linkedin_url: venture.linkedin_url ?? "",
    contact_email: venture.contact_email ?? "",
    area_ids: venture.venture_areas.map((a) => a.area_id),
  };

  const isOwner = venture.user_id === user.id;

  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-unis-text">Editar venture</h1>
      <p className="mt-2 text-base text-unis-gray">{venture.name}</p>
      <div className="mt-8">
        <VentureForm
          action={updateVenture.bind(null, slug)}
          defaults={defaults}
          sectors={sectors}
          areas={areas}
          allowedTypes={allowedTypes}
          mode="edit"
          republish={isOwner && venture.status === "published"}
          cancelHref={`/ventures/${slug}`}
        />
      </div>

      <section className="mt-10 border-t border-unis-lightgray pt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-unis-text">Zona de peligro</h2>
        <form action={deleteVenture.bind(null, slug)} className="mt-3">
          <DeleteVentureButton />
        </form>
      </section>
    </>
  );
}
