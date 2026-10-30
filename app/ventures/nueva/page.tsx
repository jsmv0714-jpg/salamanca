import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import { allowedVentureTypes } from "../../../lib/ventures";
import VentureForm, { type VentureFormDefaults } from "../../../components/ventures/venture-form";
import { createVenture } from "../actions";

export default function NuevaVenturePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <NuevaVentureContent />
      </Suspense>
    </div>
  );
}

async function NuevaVentureContent() {
  const user = await requireUser("/ventures/nueva");
  const allowedTypes = allowedVentureTypes(getUserRole(user));

  if (allowedTypes.length === 0) {
    return (
      <>
        <h1 className="text-3xl font-black tracking-tight text-unis-text">Registrar una venture</h1>
        <p className="mt-3 text-sm text-unis-gray">
          Las spin-offs las registran los consultores senior (docentes) y las startups las registran los
          emprendedores y estudiantes. Tu tipo de cuenta no puede crear ventures.
        </p>
        <Link href="/ventures" className="mt-6 inline-block text-sm font-medium text-unis-red hover:underline">
          Ver ventures publicadas
        </Link>
      </>
    );
  }

  const [sectors, areas] = await Promise.all([
    prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.areas_of_expertise.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const defaults: VentureFormDefaults = {
    type: allowedTypes[0],
    name: "",
    tagline: "",
    description: "",
    sector_id: "",
    business_model: "both",
    trl_level: "1",
    service_stage: "",
    research_group: "",
    senior_consultant: "",
    city: "",
    logo_url: "",
    website: "",
    linkedin_url: "",
    contact_email: "",
    area_ids: [],
  };

  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-unis-text">Registrar una venture</h1>
      <p className="mt-2 text-base text-unis-gray">
        Cuéntanos sobre tu spin-off o startup. Un administrador la revisará antes de publicarla.
      </p>
      <div className="mt-8">
        <VentureForm
          action={createVenture}
          defaults={defaults}
          sectors={sectors}
          areas={areas}
          allowedTypes={allowedTypes}
          mode="create"
          cancelHref="/cuenta"
        />
      </div>
    </>
  );
}
