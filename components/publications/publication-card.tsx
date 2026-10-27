import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";

type PublicationCardProps = {
  publication: any;
};

export default function PublicationCard({ publication }: PublicationCardProps) {
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
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-unis-lightgray bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
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
        </div>

        <Link href={`/publicaciones/${publication.slug}`} className="mt-4 block">
          <h3 className="text-lg font-bold leading-snug text-unis-text transition group-hover:text-unis-red">
            {publication.title}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-unis-gray">
          {publication.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-unis-gray">
          {publication.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{publication.location}</span>
            </div>
          )}
          {publication.deadline && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              <span>Hasta {new Date(publication.deadline).toLocaleDateString("es-CO")}</span>
            </div>
          )}
          {isInternship && careers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{careers.join(", ")}</span>
            </div>
          )}
        </div>

        {(sectors.length > 0 || areas.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sectors.slice(0, 3).map((sector: string) => (
              <span
                key={sector}
                className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs text-unis-gray ring-1 ring-inset ring-unis-lightgray"
              >
                {sector}
              </span>
            ))}
            {areas.slice(0, 2).map((area: string) => (
              <span
                key={area}
                className="inline-flex items-center rounded-md bg-unis-bg px-2 py-1 text-xs text-unis-gray ring-1 ring-inset ring-unis-lightgray"
              >
                {area}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-unis-lightgray px-6 py-3">
        <p className="text-xs text-unis-gray">Contacto fuera de plataforma</p>
        <Link
          href={`/publicaciones/${publication.slug}`}
          className="text-sm font-semibold text-unis-red transition hover:text-red-700"
        >
          Ver detalles →
        </Link>
      </div>
    </article>
  );
}
