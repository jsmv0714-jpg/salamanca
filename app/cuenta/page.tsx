import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "../../lib/session";
import { prisma } from "../../lib/prisma";
import { ROLE_LABELS, STATUS_LABELS } from "../../lib/roles";
import { getUserRole, getUserStatus } from "../../lib/permissions";
import { allowedVentureTypes, isDirectoryRole } from "../../lib/ventures";
import { isAuthorRole } from "../../lib/publications";
import SignOutButton from "../../components/auth/sign-out-button";
import VentureCard from "../../components/ventures/venture-card";
import Callout from "../../components/ui/callout";

export default function CuentaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<CuentaSkeleton />}>
        <CuentaContent />
      </Suspense>
    </div>
  );
}

function Section({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <section className="rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-unis-text">{title}</h2>
      <p className="mt-1 text-sm text-unis-gray">{description}</p>
      <Link href={href} className="mt-4 inline-block text-sm font-semibold text-unis-red hover:underline">
        {action}
      </Link>
    </section>
  );
}

async function CuentaContent() {
  const user = await requireUser("/cuenta");

  const role = getUserRole(user);
  const status = getUserStatus(user);

  const canCreateVentures = allowedVentureTypes(role).length > 0;
  const canPublish = isAuthorRole(role);
  const canApply = role !== "admin";
  const isAdmin = role === "admin";

  const [ventures, myPublications, myApplications, pendingUsers, publicationsInReview, venturesInReview] =
    await Promise.all([
      canCreateVentures
        ? prisma.ventures.findMany({
            where: { user_id: user.id },
            orderBy: { updated_at: "desc" },
            include: { sectors: true },
          })
        : Promise.resolve([]),
      canPublish
        ? prisma.publications.findMany({
            where: { user_id: user.id },
            select: { status: true, applications: { select: { status: true } } },
          })
        : Promise.resolve([]),
      canApply ? prisma.applications.count({ where: { applicant_id: user.id } }) : Promise.resolve(0),
      isAdmin ? prisma.users.count({ where: { status: "pending" } }) : Promise.resolve(0),
      isAdmin ? prisma.publications.count({ where: { status: "in_review" } }) : Promise.resolve(0),
      isAdmin ? prisma.ventures.count({ where: { status: "in_review" } }) : Promise.resolve(0),
    ]);

  const newApplications = myPublications.reduce(
    (total, p) => total + p.applications.filter((a) => a.status === "sent").length,
    0
  );

  const rows: { label: string; value: string }[] = [
    { label: "Nombre", value: user.name },
    { label: "Correo electrónico", value: user.email },
    { label: "Tipo de cuenta", value: ROLE_LABELS[role] ?? role },
    { label: "Estado de la cuenta", value: STATUS_LABELS[status] ?? status },
    {
      label: "Miembro desde",
      value: new Date(user.createdAt).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  ];

  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-unis-text">
        Hola, {user.name.trim().split(/\s+/)[0]}
      </h1>
      <p className="mt-2 text-base text-unis-gray">Esta es tu cuenta en el Marketplace Unisalamanca.</p>

      {!isAdmin && status !== "active" ? (
        <div className="mt-6">
          <Callout tone="warning">
            {status === "suspended"
              ? "Tu cuenta está suspendida. Contacta a la universidad para resolverlo."
              : "Tu cuenta está pendiente de activación. Cuando un administrador la active podrás publicar, postularte y aparecer en el directorio."}
          </Callout>
        </div>
      ) : null}

      <div className="mt-8 rounded-lg border border-unis-lightgray bg-white shadow-sm">
        <dl className="divide-y divide-unis-lightgray">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-sm font-medium text-unis-gray">{row.label}</dt>
              <dd className="text-sm font-semibold text-unis-text">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 space-y-6">
        {canPublish ? (
          <Section
            title="Mis publicaciones"
            description={
              myPublications.length === 0
                ? "Publica prácticas, servicios o solicitudes para el ecosistema."
                : `${myPublications.length} ${myPublications.length === 1 ? "publicación" : "publicaciones"}${
                    newApplications > 0 ? ` · ${newApplications} postulaciones sin revisar` : ""
                  }.`
            }
            href="/cuenta/publicaciones"
            action="Gestionar mis publicaciones"
          />
        ) : null}

        {canApply ? (
          <Section
            title="Mis postulaciones"
            description={
              myApplications === 0
                ? "Aquí verás las solicitudes que envíes a las publicaciones."
                : `${myApplications} ${myApplications === 1 ? "solicitud enviada" : "solicitudes enviadas"}.`
            }
            href="/cuenta/postulaciones"
            action="Ver mis postulaciones"
          />
        ) : null}

        {isDirectoryRole(role) ? (
          <Section
            title="Perfil del directorio"
            description="Presenta tu core y las asesorías que ofreces para que otros miembros del ecosistema te encuentren."
            href="/cuenta/directorio"
            action="Editar mi perfil del directorio"
          />
        ) : null}

        {canCreateVentures ? (
          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-unis-text">Mis ventures</h2>
              <Link href="/ventures/nueva" className="text-sm font-semibold text-unis-red hover:underline">
                Nueva venture
              </Link>
            </div>
            {ventures.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-unis-lightgray px-6 py-8 text-center text-sm text-unis-gray">
                Todavía no has registrado ninguna venture.
              </p>
            ) : (
              <div className="mt-3 grid gap-4">
                {ventures.map((venture) => (
                  <VentureCard key={venture.id} venture={venture} showStatus />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {isAdmin ? (
          <section className="rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-unis-text">Administración</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/admin/usuarios" className="font-semibold text-unis-red hover:underline">
                  Cuentas de usuario
                </Link>
                <span className="text-unis-gray">
                  {pendingUsers === 0 ? " · ninguna pendiente" : ` · ${pendingUsers} por activar`}
                </span>
              </li>
              <li>
                <Link href="/admin/publicaciones" className="font-semibold text-unis-red hover:underline">
                  Publicaciones
                </Link>
                <span className="text-unis-gray">
                  {publicationsInReview === 0 ? " · ninguna en revisión" : ` · ${publicationsInReview} en revisión`}
                </span>
              </li>
              <li>
                <Link href="/admin/ventures" className="font-semibold text-unis-red hover:underline">
                  Ventures
                </Link>
                <span className="text-unis-gray">
                  {venturesInReview === 0 ? " · ninguna en revisión" : ` · ${venturesInReview} en revisión`}
                </span>
              </li>
            </ul>
          </section>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/publicaciones"
          className="rounded-md bg-unis-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
        >
          Ver publicaciones
        </Link>
        <SignOutButton className="flex items-center gap-1.5 rounded-md border border-unis-lightgray px-5 py-2.5 text-sm font-medium text-unis-gray transition hover:border-unis-red hover:text-unis-red disabled:opacity-50" />
      </div>
    </>
  );
}

function CuentaSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true">
      <div className="h-9 w-48 rounded bg-unis-lightgray" />
      <div className="mt-3 h-5 w-80 max-w-full rounded bg-unis-lightgray" />
      <div className="mt-8 h-64 rounded-lg border border-unis-lightgray bg-unis-bg" />
    </div>
  );
}
