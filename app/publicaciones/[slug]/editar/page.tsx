import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/session";
import { toDateInput } from "../../../../lib/dates";
import Callout from "../../../../components/ui/callout";
import ConfirmButton from "../../../../components/ui/confirm-button";
import { secondaryButtonClass } from "../../../../components/ui/form";
import PublicationForm, { type PublicationFormDefaults } from "../../../../components/publications/publication-form";
import { deletePublication, updatePublication } from "../../actions";

export default function EditarPublicacionPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <EditarPublicacionContent params={params} />
      </Suspense>
    </div>
  );
}

async function EditarPublicacionContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/publicaciones/${slug}/editar`);

  const publication = await prisma.publications.findUnique({
    where: { slug },
    include: { publication_sectors: true, publication_careers: true, publication_areas: true },
  });
  if (!publication || publication.user_id !== user.id) notFound();

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
    publication_type_id: publication.publication_type_id,
    title: publication.title,
    description: publication.description,
    requirements: publication.requirements ?? "",
    benefits: publication.benefits ?? "",
    location: publication.location ?? "",
    modality: publication.modality ?? "",
    deadline: toDateInput(publication.deadline),
    contact_email: publication.contact_email ?? "",
    contact_phone: publication.contact_phone ?? "",
    show_contact: publication.show_contact,
    sector_ids: publication.publication_sectors.map((s) => s.sector_id),
    career_ids: publication.publication_careers.map((c) => c.career_id),
    area_ids: publication.publication_areas.map((a) => a.area_id),
  };

  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-unis-text">Editar publicación</h1>
      <p className="mt-2 text-base text-unis-gray">{publication.title}</p>

      {publication.status === "rejected" && publication.rejection_reason ? (
        <div className="mt-4">
          <Callout tone="error">
            <span className="font-semibold">No fue aprobada:</span> {publication.rejection_reason}
          </Callout>
        </div>
      ) : null}

      <div className="mt-8">
        <PublicationForm
          action={updatePublication.bind(null, slug)}
          defaults={defaults}
          types={types}
          sectors={sectors}
          careers={careers}
          areas={areas}
          mode="edit"
          republish={publication.status === "published" || publication.status === "closed"}
          cancelHref={`/publicaciones/${slug}`}
        />
      </div>

      <section className="mt-10 border-t border-unis-lightgray pt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-unis-text">Zona de peligro</h2>
        <p className="mt-2 text-xs text-unis-gray">
          Al eliminar la publicación también se borran las postulaciones que haya recibido.
        </p>
        <form action={deletePublication.bind(null, slug)} className="mt-3">
          <ConfirmButton
            message="¿Eliminar esta publicación y sus postulaciones? Esta acción no se puede deshacer."
            className={`${secondaryButtonClass} hover:bg-red-50`}
          >
            Eliminar publicación
          </ConfirmButton>
        </form>
      </section>
    </>
  );
}
