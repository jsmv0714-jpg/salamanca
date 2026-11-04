import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import { isAuthorRole } from "../../../lib/publications";
import Badge from "../../../components/ui/badge";
import Callout from "../../../components/ui/callout";
import ConfirmButton from "../../../components/ui/confirm-button";
import { primaryButtonClass, secondaryButtonClass } from "../../../components/ui/form";
import { PublicationStatusBadge } from "../../../components/publications/status-badges";
import { setPublicationClosed } from "../../publicaciones/actions";

export default function MisPublicacionesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <MisPublicacionesContent />
      </Suspense>
    </div>
  );
}

async function MisPublicacionesContent() {
  const user = await requireUser("/cuenta/publicaciones");

  if (!isAuthorRole(getUserRole(user))) {
    return (
      <>
        <h1 className="text-3xl font-black tracking-tight text-unis-text">Mis publicaciones</h1>
        <p className="mt-3 text-sm text-unis-gray">
          Las publicaciones las crean las empresas, agremiaciones y emprendedores. Puedes ver tus solicitudes en
          «Mis postulaciones».
        </p>
        <Link href="/cuenta/postulaciones" className="mt-6 inline-block text-sm font-medium text-unis-red hover:underline">
          Ir a mis postulaciones
        </Link>
      </>
    );
  }

  const publications = await prisma.publications.findMany({
    where: { user_id: user.id },
    orderBy: { updated_at: "desc" },
    include: {
      publication_types: { select: { name: true } },
      applications: { select: { status: true } },
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-unis-text">Mis publicaciones</h1>
          <p className="mt-1 text-sm text-unis-gray">Gestiona tus ofertas y revisa quién se ha postulado.</p>
        </div>
        <Link href="/publicaciones/nueva" className={primaryButtonClass}>
          Nueva publicación
        </Link>
      </div>

      {publications.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-unis-lightgray py-14 text-center text-sm text-unis-gray">
          Todavía no has creado ninguna publicación.
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {publications.map((publication) => {
            const total = publication.applications.filter((a) => a.status !== "withdrawn").length;
            const fresh = publication.applications.filter((a) => a.status === "sent").length;
            return (
              <li key={publication.id} className="rounded-lg border border-unis-lightgray bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{publication.publication_types.name}</Badge>
                  <PublicationStatusBadge status={publication.status} />
                  {fresh > 0 ? <Badge tone="amber">{fresh} sin revisar</Badge> : null}
                </div>
                <h2 className="mt-2 text-lg font-bold text-unis-text">{publication.title}</h2>

                {publication.status === "rejected" && publication.rejection_reason ? (
                  <div className="mt-3">
                    <Callout tone="error">
                      <span className="font-semibold">No fue aprobada:</span> {publication.rejection_reason}
                    </Callout>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href={`/publicaciones/${publication.slug}`} className={secondaryButtonClass}>
                    Ver
                  </Link>
                  <Link href={`/publicaciones/${publication.slug}/editar`} className={secondaryButtonClass}>
                    Editar
                  </Link>
                  <Link href={`/publicaciones/${publication.slug}/postulaciones`} className={secondaryButtonClass}>
                    Postulaciones ({total})
                  </Link>
                  {publication.status === "published" ? (
                    <form action={setPublicationClosed.bind(null, publication.slug, true)}>
                      <ConfirmButton
                        message="¿Cerrar la publicación? Dejará de recibir postulaciones y de aparecer en el listado."
                        className={secondaryButtonClass}
                      >
                        Cerrar
                      </ConfirmButton>
                    </form>
                  ) : null}
                  {publication.status === "closed" ? (
                    <form action={setPublicationClosed.bind(null, publication.slug, false)}>
                      <button type="submit" className={secondaryButtonClass}>
                        Reabrir
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
