import { Suspense } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Heart,
  Briefcase,
  ChevronRight,
  FileText,
  Rocket,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "../../lib/session";
import { prisma } from "../../lib/prisma";
import { ROLE_LABELS, STATUS_LABELS } from "../../lib/roles";
import { getUserRole, getUserStatus } from "../../lib/permissions";
import { allowedVentureTypes, isDirectoryRole } from "../../lib/ventures";
import { isAuthorRole } from "../../lib/publications";
import { buildChecklist, readSocialLinks } from "../../lib/profile";
import SignOutButton from "../../components/auth/sign-out-button";
import VentureCard from "../../components/ventures/venture-card";
import Callout from "../../components/ui/callout";
import TechBackground from "../../components/ui/tech-background";
import Reveal from "../../components/ui/reveal";
import { param } from "../../lib/query";

type SearchParams = Record<string, string | string[] | undefined>;

export default function CuentaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<CuentaSkeleton />}>
      <CuentaContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CuentaContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sessionUser = await requireUser("/cuenta");
  const params = await searchParams;

  const role = getUserRole(sessionUser);
  const status = getUserStatus(sessionUser);

  const canCreateVentures = allowedVentureTypes(role).length > 0;
  const canPublish = isAuthorRole(role);
  const canApply = role !== "admin";
  const isAdmin = role === "admin";

  const [
    ventures,
    myPublications,
    myApplications,
    unreadNotifications,
    pendingUsers,
    publicationsInReview,
    venturesInReview,
    openReports,
    draftNews,
    profile,
  ] = await Promise.all([
    canCreateVentures
      ? prisma.ventures.findMany({
          where: { user_id: sessionUser.id },
          orderBy: { updated_at: "desc" },
          include: { sectors: true },
        })
      : Promise.resolve([]),
    canPublish
      ? prisma.publications.findMany({
          where: { user_id: sessionUser.id },
          select: { status: true, applications: { select: { status: true } } },
        })
      : Promise.resolve([]),
    canApply ? prisma.applications.count({ where: { applicant_id: sessionUser.id } }) : Promise.resolve(0),
    prisma.notifications.count({ where: { user_id: sessionUser.id, read_at: null } }),
    isAdmin ? prisma.users.count({ where: { status: "pending" } }) : Promise.resolve(0),
    isAdmin ? prisma.publications.count({ where: { status: "in_review" } }) : Promise.resolve(0),
    isAdmin ? prisma.ventures.count({ where: { status: "in_review" } }) : Promise.resolve(0),
    isAdmin ? prisma.publication_reports.count({ where: { status: "open" } }) : Promise.resolve(0),
    isAdmin ? prisma.news.count({ where: { status: "draft" } }) : Promise.resolve(0),
    prisma.users.findUnique({
      where: { id: sessionUser.id },
      select: {
        image: true,
        headline: true,
        bio: true,
        skills: true,
        city: true,
        phone: true,
        contact_email: true,
        social_links: true,
        profile_public: true,
        students: { select: { career_id: true, semester: true } },
        teachers: { select: { title: true } },
        companies: { select: { sector_id: true } },
        associations: { select: { sector_id: true } },
        entrepreneurs: { select: { project_name: true } },
      },
    }),
  ]);

  const newApplications = myPublications.reduce(
    (total, p) => total + p.applications.filter((a) => a.status === "sent").length,
    0
  );

  const links = readSocialLinks(profile?.social_links);
  const checklist = profile
    ? buildChecklist({
        role,
        hasPhoto: Boolean(profile.image),
        headline: profile.headline,
        bio: profile.bio,
        skillCount: profile.skills.length,
        city: profile.city,
        contactPhone: profile.phone,
        contactEmail: profile.contact_email,
        socialCount: Object.keys(links).length,
        roleValues: {
          career_id: profile.students?.career_id,
          semester: profile.students?.semester,
          title: profile.teachers?.title,
          sector_id: profile.companies?.sector_id ?? profile.associations?.sector_id,
          project_name: profile.entrepreneurs?.project_name,
        },
      })
    : { percent: 0, items: [] };

  const firstName = sessionUser.name.trim().split(/\s+/)[0] || "Hola";
  const initial = sessionUser.name.trim().charAt(0).toUpperCase() || "?";
  const isLogo = role === "company" || role === "association";

  const actions: Array<{
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
    tone?: "cyan" | "amber";
  }> = [
    {
      title: "Datos de acceso",
      description: "Nombre, correo y contraseña de tu cuenta.",
      href: "/cuenta/perfil",
      icon: Settings,
    },
    {
      title: "Perfil profesional",
      description: "Foto, presentación, habilidades, contacto y redes.",
      href: "/cuenta/perfil-profesional",
      icon: UserCircle,
      badge: checklist.percent < 100 ? `${checklist.percent}% completo` : "Completo",
      tone: checklist.percent < 100 ? "amber" : "cyan",
    },
    {
      title: "Guardados",
      description: "Publicaciones y ventures que marcaste con me gusta.",
      href: "/cuenta/guardados",
      icon: Heart,
    },
    {
      title: "Notificaciones",
      description:
        unreadNotifications === 0
          ? "Avisos de postulaciones, decisiones y reportes."
          : `${unreadNotifications} ${unreadNotifications === 1 ? "aviso sin leer" : "avisos sin leer"}.`,
      href: "/cuenta/notificaciones",
      icon: Bell,
      badge: unreadNotifications > 0 ? String(unreadNotifications) : undefined,
      tone: unreadNotifications > 0 ? "amber" : undefined,
    },
  ];

  if (canPublish) {
    actions.push({
      title: "Mis publicaciones",
      description:
        myPublications.length === 0
          ? "Publica prácticas, servicios o solicitudes."
          : `${myPublications.length} ${myPublications.length === 1 ? "publicación" : "publicaciones"}${
              newApplications > 0 ? ` · ${newApplications} sin revisar` : ""
            }.`,
      href: "/cuenta/publicaciones",
      icon: FileText,
      badge: newApplications > 0 ? String(newApplications) : undefined,
      tone: newApplications > 0 ? "amber" : undefined,
    });
  }
  if (canApply) {
    actions.push({
      title: "Mis postulaciones",
      description:
        myApplications === 0
          ? "Solicitudes que envíes a las publicaciones."
          : `${myApplications} ${myApplications === 1 ? "solicitud enviada" : "solicitudes enviadas"}.`,
      href: "/cuenta/postulaciones",
      icon: Briefcase,
    });
  }
  if (isDirectoryRole(role)) {
    actions.push({
      title: "Perfil del directorio",
      description: "Tu ficha para que el ecosistema te encuentre.",
      href: "/cuenta/directorio",
      icon: BookOpen,
    });
  }

  return (
    <>
      <div className="relative isolate overflow-hidden bg-unis-red">
        <TechBackground />
        <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-10 sm:px-6 lg:px-8">
          <Reveal>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Hola, {firstName}</h1>
            <p className="mt-2 max-w-2xl text-base text-white/80">
              Tu espacio en el Marketplace Unisalamanca: perfil, actividad y avisos en un solo lugar.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="relative mx-auto -mt-16 max-w-5xl space-y-8 px-4 pb-16 sm:px-6 lg:px-8">
        {param(params.bienvenida) && status === "pending" ? (
          <Callout tone="success">
            ¡Correo confirmado! Revisaremos tu cuenta y, cuando un administrador la active, podrás publicar, postularte y
            aparecer en el directorio.
          </Callout>
        ) : null}

        {!isAdmin && status !== "active" ? (
          <Callout tone="warning">
            {status === "suspended"
              ? "Tu cuenta está suspendida. Contacta a la universidad para resolverlo."
              : "Tu cuenta está pendiente de activación. Cuando un administrador la active podrás publicar, postularte y aparecer en el directorio."}
          </Callout>
        ) : null}

        <Reveal>
          <section className="overflow-hidden rounded-3xl border border-unis-lightgray bg-white shadow-xl">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
              {profile?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image}
                  alt={isLogo ? `Logo de ${sessionUser.name}` : `Foto de ${sessionUser.name}`}
                  className={`h-24 w-24 shrink-0 bg-white object-cover ring-4 ring-unis-cyan/20 ${isLogo ? "rounded-2xl object-contain" : "rounded-full"}`}
                />
              ) : (
                <div
                  aria-hidden="true"
                  className={`flex h-24 w-24 shrink-0 items-center justify-center bg-gradient-to-br from-unis-cyan/20 to-unis-blue/20 text-4xl font-black text-unis-red ring-4 ring-unis-cyan/20 ${isLogo ? "rounded-2xl" : "rounded-full"}`}
                >
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-unis-bg px-3 py-1 text-xs font-semibold text-unis-gray ring-1 ring-inset ring-unis-lightgray">
                    {ROLE_LABELS[role] ?? role}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      status === "active"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : status === "suspended"
                          ? "bg-red-50 text-red-700 ring-red-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}
                  >
                    {STATUS_LABELS[status] ?? status}
                  </span>
                </div>
                <p className="mt-2 truncate text-xl font-bold text-unis-text">{sessionUser.name}</p>
                {profile?.headline ? <p className="truncate text-sm text-unis-gray">{profile.headline}</p> : null}
                <p className="mt-1 text-sm text-unis-gray">{sessionUser.email}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Link
                  href="/cuenta/perfil-profesional"
                  className="inline-flex items-center justify-center rounded-full bg-unis-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
                >
                  Completar mi perfil
                </Link>
                {profile?.profile_public && status === "active" ? (
                  <Link href={`/perfiles/${sessionUser.id}`} className="text-sm font-medium text-unis-red hover:underline">
                    Ver mi perfil público
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="border-t border-unis-lightgray bg-unis-bg/60 px-6 py-4 sm:px-8">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-unis-gray">Perfil profesional</span>
                <span className="font-bold text-unis-red tabular-nums">{checklist.percent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-unis-lightgray/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-unis-cyan to-unis-blue transition-[width] duration-700"
                  style={{ width: `${checklist.percent}%` }}
                />
              </div>
            </div>
          </section>
        </Reveal>

        <section>
          <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-unis-text">
            <span aria-hidden="true" className="h-5 w-1 rounded-full bg-unis-cyan" />
            Accesos rápidos
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((action, index) => (
              <Reveal key={action.href} delay={index * 40}>
                <Link
                  href={action.href}
                  className="group flex h-full flex-col rounded-2xl border border-unis-lightgray bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-unis-cyan hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-unis-cyan/10 text-unis-red ring-1 ring-inset ring-unis-cyan/30 transition group-hover:bg-unis-cyan/20">
                      <action.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    {action.badge ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          action.tone === "amber" ? "bg-amber-100 text-amber-800" : "bg-unis-cyan/15 text-unis-blue"
                        }`}
                      >
                        {action.badge}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 font-bold text-unis-text group-hover:text-unis-red">{action.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-unis-gray">{action.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-unis-red">
                    Abrir <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {canCreateVentures ? (
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-3 text-lg font-bold text-unis-text">
                <span aria-hidden="true" className="h-5 w-1 rounded-full bg-unis-cyan" />
                Mis ventures
              </h2>
              <Link href="/ventures/nueva" className="inline-flex items-center gap-1.5 text-sm font-semibold text-unis-red hover:underline">
                <Rocket className="h-4 w-4" aria-hidden="true" /> Nueva venture
              </Link>
            </div>
            {ventures.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-unis-lightgray bg-white px-6 py-10 text-center text-sm text-unis-gray">
                Todavía no has registrado ninguna venture.
              </p>
            ) : (
              <div className="grid gap-4">
                {ventures.map((venture) => (
                  <VentureCard key={venture.id} venture={venture} showStatus />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {isAdmin ? (
          <Reveal>
            <section className="rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-3 text-lg font-bold text-unis-text">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-unis-red/10 text-unis-red">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                Administración
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                <AdminLink href="/admin/usuarios" label="Cuentas de usuario" count={pendingUsers} countLabel="por activar" icon={Users} />
                <AdminLink href="/admin/publicaciones" label="Publicaciones" count={publicationsInReview} countLabel="en revisión" icon={FileText} />
                <AdminLink href="/admin/ventures" label="Ventures" count={venturesInReview} countLabel="en revisión" icon={Rocket} />
                <AdminLink href="/admin/reportes" label="Reportes de abuso" count={openReports} countLabel="por revisar" icon={ShieldCheck} />
                <AdminLink href="/admin/noticias" label="Noticias y eventos" count={draftNews} countLabel="borradores" icon={FileText} />
              </ul>
            </section>
          </Reveal>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-unis-lightgray pt-4">
          <Link
            href="/publicaciones"
            className="rounded-full bg-unis-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
          >
            Ver publicaciones
          </Link>
          <SignOutButton className="flex items-center gap-1.5 rounded-full border border-unis-lightgray px-5 py-2.5 text-sm font-medium text-unis-gray transition hover:border-unis-red hover:text-unis-red disabled:opacity-50" />
          <span className="ml-auto text-xs text-unis-gray">
            Miembro desde{" "}
            {new Date(sessionUser.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>
    </>
  );
}

function AdminLink({
  href,
  label,
  count,
  countLabel,
  icon: Icon,
}: {
  href: string;
  label: string;
  count: number;
  countLabel: string;
  icon: LucideIcon;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 rounded-xl border border-unis-lightgray p-4 transition hover:border-unis-cyan hover:bg-unis-bg"
      >
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-unis-cyan" aria-hidden="true" />
          <span className="text-sm font-semibold text-unis-text">{label}</span>
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${count > 0 ? "bg-amber-100 text-amber-800" : "bg-unis-bg text-unis-gray"}`}>
          {count > 0 ? `${count} ${countLabel}` : "Al día"}
        </span>
      </Link>
    </li>
  );
}

function CuentaSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true">
      <div className="h-56 bg-unis-red/90" />
      <div className="mx-auto -mt-16 max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="h-40 rounded-3xl border border-unis-lightgray bg-white" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl border border-unis-lightgray bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
