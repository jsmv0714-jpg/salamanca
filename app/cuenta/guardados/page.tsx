import { Suspense } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { authorDisplayName } from "../../../lib/listing";
import { isVentureType, VENTURE_TYPE_LABELS } from "../../../lib/ventures";
import Badge from "../../../components/ui/badge";
import Reveal from "../../../components/ui/reveal";
import TechBackground from "../../../components/ui/tech-background";
import { DetailBackLink } from "../../../components/ui/detail-layout";
import { toggleSaved } from "../../marcas/actions";

export default function GuardadosPage() {
  return (
    <div className="relative isolate overflow-hidden bg-unis-red">
      <TechBackground />
      <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <DetailBackLink href="/cuenta">Volver a mi cuenta</DetailBackLink>
        <Reveal>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">Guardados</h1>
          <p className="mt-2 max-w-2xl text-base text-white/80">
            Las publicaciones, ventures y miembros del directorio que marcaste con me gusta, para revisarlos más tarde.
          </p>
        </Reveal>
      </div>
      <div className="relative mx-auto -mt-14 max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-busy="true" />}>
          <GuardadosContent />
        </Suspense>
      </div>
    </div>
  );
}

async function GuardadosContent() {
  const user = await requireUser("/cuenta/guardados");

  const [publications, ventures, directory] = await Promise.all([
    prisma.publication_marks.findMany({
      where: { user_id: user.id, saved: true, publications: { status: { in: ["published", "closed"] } } },
      orderBy: { updated_at: "desc" },
      select: {
        publications: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            location: true,
            publication_types: { select: { name: true } },
            users: {
              select: {
                name: true,
                companies: { select: { trade_name: true } },
                associations: { select: { name: true } },
                entrepreneurs: { select: { project_name: true, first_name: true, last_name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.venture_marks.findMany({
      where: { user_id: user.id, saved: true, ventures: { status: "published" } },
      orderBy: { updated_at: "desc" },
      select: {
        ventures: { select: { id: true, slug: true, name: true, type: true, tagline: true, city: true } },
      },
    }),
    prisma.directory_marks.findMany({
      where: {
        user_id: user.id,
        saved: true,
        directory_profiles: { is_visible: true, users: { status: "active" } },
      },
      orderBy: { updated_at: "desc" },
      select: {
        directory_profiles: {
          select: {
            id: true,
            display_name: true,
            headline: true,
            users: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="grid gap-8">
      <section className="rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-3 text-lg font-bold text-unis-text">
          <Heart className="h-5 w-5 fill-unis-red text-unis-red" aria-hidden="true" />
          Publicaciones guardadas ({publications.length})
        </h2>
        {publications.length === 0 ? (
          <p className="mt-4 text-sm text-unis-gray">
            Aún no guardas publicaciones. Pulsa el corazón en el detalle de una publicación para guardarla aquí.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-unis-lightgray">
            {publications.map(({ publications: pub }) => (
              <li key={pub.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <Link href={`/publicaciones?ver=${pub.slug}`} className="font-semibold text-unis-text hover:text-unis-red">
                    {pub.title}
                  </Link>
                  <p className="mt-1 text-sm text-unis-gray">
                    {authorDisplayName(pub.users)}
                    {pub.location ? ` · ${pub.location}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="blue">{pub.publication_types.name}</Badge>
                    {pub.status === "closed" ? <Badge tone="amber">Cerrada</Badge> : null}
                  </div>
                </div>
                <form action={toggleSaved}>
                  <input type="hidden" name="kind" value="publication" />
                  <input type="hidden" name="id" value={pub.id} />
                  <input type="hidden" name="next" value="/cuenta/guardados" />
                  <button type="submit" className="text-sm font-medium text-unis-gray hover:text-unis-red hover:underline">
                    Quitar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-3 text-lg font-bold text-unis-text">
          <Heart className="h-5 w-5 fill-unis-red text-unis-red" aria-hidden="true" />
          Ventures guardadas ({ventures.length})
        </h2>
        {ventures.length === 0 ? (
          <p className="mt-4 text-sm text-unis-gray">
            Aún no guardas ventures. Pulsa el corazón en el detalle de una venture para guardarla aquí.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-unis-lightgray">
            {ventures.map(({ ventures: venture }) => (
              <li key={venture.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <Link href={`/ventures?ver=${venture.slug}`} className="font-semibold text-unis-text hover:text-unis-red">
                    {venture.name}
                  </Link>
                  {venture.tagline ? <p className="mt-1 text-sm text-unis-gray">{venture.tagline}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="blue">{isVentureType(venture.type) ? VENTURE_TYPE_LABELS[venture.type] : venture.type}</Badge>
                    {venture.city ? <Badge>{venture.city}</Badge> : null}
                  </div>
                </div>
                <form action={toggleSaved}>
                  <input type="hidden" name="kind" value="venture" />
                  <input type="hidden" name="id" value={venture.id} />
                  <input type="hidden" name="next" value="/cuenta/guardados" />
                  <button type="submit" className="text-sm font-medium text-unis-gray hover:text-unis-red hover:underline">
                    Quitar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-3 text-lg font-bold text-unis-text">
          <Heart className="h-5 w-5 fill-unis-red text-unis-red" aria-hidden="true" />
          Miembros del directorio guardados ({directory.length})
        </h2>
        {directory.length === 0 ? (
          <p className="mt-4 text-sm text-unis-gray">
            Aún no guardas miembros. Pulsa el corazón en el detalle de una ficha del directorio para guardarla aquí.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-unis-lightgray">
            {directory.map(({ directory_profiles: profile }) => {
              const name = profile.display_name || profile.users.name || "Miembro del directorio";
              return (
                <li key={profile.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <Link href={`/directorio?ver=${profile.id}`} className="font-semibold text-unis-text hover:text-unis-red">
                      {name}
                    </Link>
                    {profile.headline ? <p className="mt-1 text-sm text-unis-gray">{profile.headline}</p> : null}
                  </div>
                  <form action={toggleSaved}>
                    <input type="hidden" name="kind" value="directory" />
                    <input type="hidden" name="id" value={profile.id} />
                    <input type="hidden" name="next" value="/cuenta/guardados" />
                    <button type="submit" className="text-sm font-medium text-unis-gray hover:text-unis-red hover:underline">
                      Quitar
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
