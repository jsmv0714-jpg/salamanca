import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { CalendarDays, MapPin } from "lucide-react";
import { prisma } from "../../../lib/prisma";
import { mediaPublicUrl } from "../../../lib/storage";
import { getCurrentUser } from "../../../lib/session";
import { getUserRole, getUserStatus } from "../../../lib/permissions";
import { formatDate, isPastDeadline } from "../../../lib/dates";
import {
  MODALITY_LABELS,
  APPLICATION_STATUS_LABELS,
  canApplyToType,
  canReapply,
  applyCopy,
  isApplicationStatus,
  isModality,
  whoCanApply,
} from "../../../lib/publications";
import Badge from "../../../components/ui/badge";
import Callout from "../../../components/ui/callout";
import {
  DetailBackLink,
  DetailFact,
  DetailHero,
  InfoCard,
  SectionTitle,
} from "../../../components/ui/detail-layout";
import { secondaryButtonClass } from "../../../components/ui/form";
import ApplyForm from "../../../components/publications/apply-form";
import TechBackground from "../../../components/ui/tech-background";
import { ApplicationStatusBadge, PublicationStatusBadge } from "../../../components/publications/status-badges";
import { applyToPublication } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const publication = await prisma.publications.findUnique({
    where: { slug },
    select: { title: true, description: true, status: true },
  });

  // Los borradores y las rechazadas no deben indexarse ni mostrar su contenido.
  if (!publication || publication.status === "draft" || publication.status === "rejected") {
    return { title: "Publicación no encontrada" };
  }

  const description = publication.description.replace(/\s+/g, " ").trim().slice(0, 155);
  return {
    title: publication.title,
    description,
    openGraph: {
      title: publication.title,
      description,
      type: "article",
    },
  };
}

export default function PublicacionDetallePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="relative isolate overflow-hidden bg-unis-red">
      <TechBackground />
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <DetailBackLink href="/publicaciones">Volver a publicaciones</DetailBackLink>
        <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
          <PublicacionDetalle params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function PublicacionDetalle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [publication, user] = await Promise.all([
    prisma.publications.findUnique({
      where: { slug },
      include: {
        publication_types: true,
        publication_sectors: { include: { sectors: true } },
        publication_careers: { include: { careers: true } },
        publication_areas: { include: { areas_of_expertise: true } },
        publication_media: { orderBy: { position: "asc" } },
        users: {
          select: {
            name: true,
            companies: { select: { trade_name: true } },
            associations: { select: { name: true } },
            entrepreneurs: { select: { project_name: true, first_name: true, last_name: true } },
          },
        },
        _count: { select: { applications: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!publication) notFound();

  const isOwner = user?.id === publication.user_id;
  const isAdmin = getUserRole(user) === "admin";
  const isPublic = publication.status === "published" || publication.status === "closed";
  if (!isPublic && !isOwner && !isAdmin) notFound();

  const typeCode = publication.publication_types.code;
  const modality = isModality(publication.modality) ? MODALITY_LABELS[publication.modality] : null;
  const careers = publication.publication_careers.map((c) => c.careers.name);
  const sectors = publication.publication_sectors.map((s) => s.sectors.name);
  const areas = publication.publication_areas.map((a) => a.areas_of_expertise.name);

  const { companies, associations, entrepreneurs } = publication.users;
  const authorName =
    companies?.trade_name ||
    associations?.name ||
    entrepreneurs?.project_name ||
    [entrepreneurs?.first_name, entrepreneurs?.last_name].filter(Boolean).join(" ") ||
    publication.users.name ||
    "Miembro del ecosistema";

  const hasContact = publication.show_contact && (publication.contact_email || publication.contact_phone);
  const expired = isPastDeadline(publication.deadline);

  // Contador de visitas: se incrementa después de responder, sin bloquear ni
  // romper la página si la escritura falla. No cuenta las visitas del autor.
  if (isPublic && !isOwner) {
    after(async () => {
      try {
        await prisma.publications.update({
          where: { id: publication.id },
          data: { views_count: { increment: 1 } },
        });
      } catch (error) {
        console.error("No se pudo actualizar el contador de visitas:", error);
      }
    });
  }

  return (
    <article className="mt-6 rounded-3xl bg-white p-6 shadow-xl sm:p-10">
      {!isPublic ? (
        <div className="mb-6 space-y-2">
          <Callout tone={publication.status === "rejected" ? "error" : "warning"}>
            <p className="font-semibold">
              Estado: <PublicationStatusBadge status={publication.status} />
            </p>
            <p className="mt-1">
              {publication.status === "draft" && "Solo tú puedes ver este borrador. Envíala a revisión cuando esté lista."}
              {publication.status === "in_review" && "Un administrador la está revisando. Aún no es pública."}
              {publication.status === "rejected" &&
                `No fue aprobada${publication.rejection_reason ? `: ${publication.rejection_reason}` : "."} Puedes corregirla y enviarla de nuevo.`}
            </p>
          </Callout>
        </div>
      ) : null}
      {publication.status === "closed" ? (
        <div className="mb-6">
          <Callout tone="info">Esta publicación está cerrada y ya no recibe postulaciones.</Callout>
        </div>
      ) : null}

      <DetailHero>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="blue">{publication.publication_types.name}</Badge>
          {modality ? <Badge>{modality}</Badge> : null}
        </div>
        <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-unis-text sm:text-4xl">
          {publication.title}
        </h1>
        <p className="mt-3 text-sm text-unis-gray">
          Publicado por <span className="font-semibold text-unis-text">{authorName}</span>
          {publication.published_at ? ` · ${formatDate(publication.published_at)}` : ""}
          {isOwner || isAdmin ? ` · ${publication.views_count} ${publication.views_count === 1 ? "visita" : "visitas"}` : ""}
        </p>
        {publication.location || publication.deadline ? (
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-unis-lightgray pt-5">
            {publication.location ? <DetailFact icon={<MapPin />}>{publication.location}</DetailFact> : null}
            {publication.deadline ? (
              <DetailFact icon={<CalendarDays />}>
                {expired ? "Venció el" : "Hasta el"} {formatDate(publication.deadline)}
              </DetailFact>
            ) : null}
          </div>
        ) : null}
      </DetailHero>

      {isOwner || isAdmin ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {isOwner ? (
            <>
              <Link href={`/publicaciones/${publication.slug}/editar`} className={secondaryButtonClass}>
                Editar publicación
              </Link>
              <Link href={`/publicaciones/${publication.slug}/postulaciones`} className={secondaryButtonClass}>
                Postulaciones recibidas ({publication._count.applications})
              </Link>
            </>
          ) : (
            <Link href="/admin/publicaciones" className={secondaryButtonClass}>
              Ir a moderación
            </Link>
          )}
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          <section>
            <SectionTitle>Descripción</SectionTitle>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-unis-gray">{publication.description}</p>
          </section>

          {publication.publication_media.length > 0 ? (
            <section>
              <SectionTitle>Galería</SectionTitle>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {publication.publication_media.map((media) => (
                  <li key={media.id} className="overflow-hidden rounded-2xl border border-unis-lightgray bg-unis-bg">
                    {media.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaPublicUrl(media.storage_key)}
                        alt={`Imagen de la publicación ${publication.title}`}
                        className="aspect-video w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={mediaPublicUrl(media.storage_key)}
                        controls
                        preload="metadata"
                        className="aspect-video w-full bg-black"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {publication.requirements ? (
            <section>
              <SectionTitle>Requisitos</SectionTitle>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-unis-gray">{publication.requirements}</p>
            </section>
          ) : null}

          {publication.benefits ? (
            <section>
              <SectionTitle>Beneficios</SectionTitle>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-unis-gray">{publication.benefits}</p>
            </section>
          ) : null}

          {careers.length > 0 || sectors.length > 0 || areas.length > 0 ? (
            <section>
              <SectionTitle>Relación con el ecosistema</SectionTitle>
              <div className="mt-3 space-y-4">
                {[
                  { title: "Carreras", items: careers },
                  { title: "Sectores", items: sectors },
                  { title: "Áreas de consultoría", items: areas },
                ]
                  .filter((group) => group.items.length > 0)
                  .map((group) => (
                    <div key={group.title}>
                      <p className="text-sm font-semibold text-unis-text">{group.title}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center rounded-md bg-unis-bg px-2.5 py-1 text-xs text-unis-gray ring-1 ring-inset ring-unis-lightgray"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 md:sticky md:top-6 md:col-span-1 md:self-start">
          <InfoCard title="Detalles">
            <ul className="space-y-2 text-sm text-unis-gray">
              {publication.location ? (
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {publication.location}
                </li>
              ) : null}
              {publication.deadline ? (
                <li className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {expired ? "Venció el" : "Hasta el"} {formatDate(publication.deadline)}
                </li>
              ) : null}
              {!publication.location && !publication.deadline ? <li>Sin detalles adicionales.</li> : null}
            </ul>
            {hasContact ? (
              <div className="mt-4 space-y-1 border-t border-unis-lightgray pt-4 text-sm">
                {publication.contact_email ? (
                  <a href={`mailto:${publication.contact_email}`} className="block font-medium text-unis-red hover:underline">
                    {publication.contact_email}
                  </a>
                ) : null}
                {publication.contact_phone ? (
                  <a href={`tel:${publication.contact_phone}`} className="block font-medium text-unis-red hover:underline">
                    {publication.contact_phone}
                  </a>
                ) : null}
              </div>
            ) : null}
          </InfoCard>

          {publication.status === "published" ? (
            <ApplyPanel
              slug={publication.slug}
              publicationId={publication.id}
              typeCode={typeCode}
              expired={expired}
              user={user}
              isOwner={isOwner}
            />
          ) : null}

          {isPublic && user && !isOwner ? (
            <p className="text-center text-xs">
              <Link
                href={`/publicaciones/${publication.slug}/reportar`}
                className="text-unis-gray transition hover:text-unis-red hover:underline"
              >
                Reportar esta publicación
              </Link>
            </p>
          ) : null}
        </aside>
      </div>
    </article>
  );
}

async function ApplyPanel({
  slug,
  publicationId,
  typeCode,
  expired,
  user,
  isOwner,
}: {
  slug: string;
  publicationId: string;
  typeCode: string;
  expired: boolean;
  user: { id: string } | null;
  isOwner: boolean;
}) {
  const copy = applyCopy(typeCode);
  const box = "rounded-2xl border border-unis-cyan/40 bg-white p-6 shadow-md ring-1 ring-unis-cyan/10";

  if (isOwner) return null;

  if (expired) {
    return (
      <section className={box}>
        <Callout tone="info">El plazo para postularse terminó.</Callout>
      </section>
    );
  }

  if (!user) {
    return (
      <section className={box}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-unis-text">{copy.title}</h2>
        <p className="mt-2 text-sm text-unis-gray">Inicia sesión o crea una cuenta para enviar tu solicitud.</p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/publicaciones/${slug}`)}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-unis-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
        >
          Iniciar sesión
        </Link>
        <Link href="/registro" className="mt-3 block text-center text-sm font-medium text-unis-red hover:underline">
          Crear cuenta
        </Link>
      </section>
    );
  }

  const role = getUserRole(user);
  if (role === "admin") return null;

  if (!canApplyToType(typeCode, role)) {
    return (
      <section className={box}>
        <Callout tone="info">{whoCanApply(typeCode)}</Callout>
      </section>
    );
  }

  if (getUserStatus(user) !== "active") {
    return (
      <section className={box}>
        <Callout tone="warning">
          Tu cuenta aún no está activa. Cuando un administrador la active podrás enviar tu solicitud.
        </Callout>
      </section>
    );
  }

  const existing = await prisma.applications.findUnique({
    where: { publication_id_applicant_id: { publication_id: publicationId, applicant_id: user.id } },
    select: { status: true, created_at: true, reapplied_at: true },
  });

  if (existing && !canReapply(existing)) {
    return (
      <section className={box}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-unis-text">Tu solicitud</h2>
        <p className="mt-2 text-sm text-unis-gray">
          La enviaste el {formatDate(existing.created_at)}.
        </p>
        <p className="mt-2">
          <ApplicationStatusBadge status={existing.status} />
        </p>
        {isApplicationStatus(existing.status) && existing.status === "withdrawn" ? (
          <p className="mt-2 text-xs text-unis-gray">
            Estado: {APPLICATION_STATUS_LABELS[existing.status]}. Ya volviste a postularte una vez; no puedes enviar otra solicitud a esta publicación.
          </p>
        ) : null}
        <Link href="/cuenta/postulaciones" className="mt-4 inline-block text-sm font-semibold text-unis-red hover:underline">
          Ver mis postulaciones
        </Link>
      </section>
    );
  }

  const student =
    role === "student"
      ? await prisma.students.findUnique({
          where: { user_id: user.id },
          select: { portfolio_url: true, linkedin_url: true, phone: true },
        })
      : null;

  return (
    <section className={box}>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-unis-text">{copy.title}</h2>
      {existing ? (
        <div className="mb-4">
          <Callout tone="info">
            Retiraste tu postulación anterior. Puedes volver a enviarla una sola vez más.
          </Callout>
        </div>
      ) : null}
      <ApplyForm
        action={applyToPublication.bind(null, slug)}
        typeCode={typeCode}
        defaults={{
          portfolio_url: student?.portfolio_url ?? "",
          linkedin_url: student?.linkedin_url ?? "",
          phone: student?.phone ?? "",
        }}
      />
    </section>
  );
}
