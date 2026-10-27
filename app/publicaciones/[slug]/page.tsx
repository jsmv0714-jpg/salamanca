import { prisma } from "../../../lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Mail, MapPin, Phone } from "lucide-react";

export default async function PublicacionDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const publication = await prisma.publications.findUnique({
    where: {
      slug: slug,
      status: "published",
    },
    include: {
      publication_types: true,
      users: true,
      publication_sectors: {
        include: {
          sectors: true,
        },
      },
      publication_careers: {
        include: {
          careers: true,
        },
      },
      publication_areas: {
        include: {
          areas_of_expertise: true,
        },
      },
    },
  });

  if (!publication) {
    notFound();
  }

  const typeName = publication.publication_types?.name || "";
  const isInternship = publication.publication_types?.code === "internship";
  const isB2BOffer = publication.publication_types?.code === "b2b_offer";
  const isB2BRequest = publication.publication_types?.code === "b2b_request";

  const getBadgeColor = () => {
    if (isInternship) return "bg-blue-50 text-blue-700 ring-blue-600/20";
    if (isB2BOffer) return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    if (isB2BRequest) return "bg-amber-50 text-amber-700 ring-amber-600/20";
    return "bg-gray-50 text-gray-700 ring-gray-600/20";
  };

  const careers = publication.publication_careers?.map((pc: any) => pc.careers?.name).filter(Boolean) || [];
  const sectors = publication.publication_sectors?.map((ps: any) => ps.sectors?.name).filter(Boolean) || [];
  const areas = publication.publication_areas?.map((pa: any) => pa.areas_of_expertise?.name).filter(Boolean) || [];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/publicaciones"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-unis-gray transition hover:text-unis-red"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a publicaciones
        </Link>

        <article className="rounded-lg border border-unis-lightgray bg-white shadow-sm">
          <header className="border-b border-unis-lightgray px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getBadgeColor()}`}>
                {typeName}
              </span>
              {publication.modality && (
                <span className="inline-flex items-center rounded-full bg-unis-bg px-2.5 py-1 text-xs font-medium text-unis-gray ring-1 ring-inset ring-unis-lightgray">
                  {publication.modality === "presential" && "Presencial"}
                  {publication.modality === "remote" && "Remoto"}
                  {publication.modality === "hybrid" && "Híbrido"}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-unis-text sm:text-3xl">
              {publication.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-unis-gray">
              {publication.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{publication.location}</span>
                </div>
              )}
              {publication.deadline && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  <span>Fecha límite: {new Date(publication.deadline).toLocaleDateString("es-CO")}</span>
                </div>
              )}
            </div>
          </header>

          <div className="space-y-8 px-6 py-6 sm:px-8">
            <section>
              <h2 className="text-lg font-bold text-unis-text">Descripción</h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-unis-gray">
                {publication.description}
              </div>
            </section>

            {publication.requirements && (
              <section>
                <h2 className="text-lg font-bold text-unis-text">Requisitos</h2>
                <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-unis-gray">
                  {publication.requirements}
                </div>
              </section>
            )}

            {publication.benefits && (
              <section>
                <h2 className="text-lg font-bold text-unis-text">Beneficios</h2>
                <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-unis-gray">
                  {publication.benefits}
                </div>
              </section>
            )}

            {(careers.length > 0 || sectors.length > 0 || areas.length > 0) && (
              <section>
                <h2 className="text-lg font-bold text-unis-text">Relación con the ecosystem</h2>
                <div className="mt-3 space-y-4">
                  {careers.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-unis-text">Dirigido a</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {careers.map((career: string) => (
                          <span key={career} className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs text-unis-gray ring-1 ring-inset ring-unis-lightgray">
                            {career}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {sectors.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-unis-text">Sectores</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sectors.map((sector: string) => (
                          <span key={sector} className="inline-flex items tags-center rounded-md bg-white px-2.5 py-1 text-xs text-unis-gray ring-1 ring-inset ring-unis-lightgray">
                            {sector}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {areas.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-unis-text">Áreas de experiencia</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {areas.map((area: string) => (
                          <span key={area} className="inline-flex items-center rounded-md bg-unis-bg px-2.5 py-1 text-xs text-unis-gray ring-1 ring-inset ring-unis-lightgray">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {publication.show_contact && (publication.contact_email || publication.contact_phone) && (
              <section className="rounded-lg border border-unis-lightgray bg-unis-bg/50 p-6">
                <h2 className="text-lg font-bold text-unis-text">Contacto para postular o contactar</h2>
                <p className="mt-1 text-sm text-unis-gray">
                  Esta plataforma actúa solo como intermediario. El contacto se realiza fuera de ella.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {publication.contact_email && (
                    <a href={`mailto:${publication.contact_email}`} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-unis-text ring-1 ring-inset ring-unis-lightgray transition hover:text-unis-red">
                      <Mail className="h-4 w-4" />
                      {publication.contact_email}
                    </a>
                  )}
                  {publication.contact_phone && (
                    <a href={`tel:${publication.contact_phone}`} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-unis-text ring-1 ring-inset ring-unis-lightgray transition hover:text-unis-red">
                      <Phone className="h-4 w-4" />
                      {publication.contact_phone}
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
