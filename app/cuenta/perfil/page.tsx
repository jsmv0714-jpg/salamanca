import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { KeyRound, Mail, Shield, User, type LucideIcon } from "lucide-react";
import { requireUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import { ROLE_LABELS } from "../../../lib/roles";
import { param } from "../../../lib/query";
import Callout from "../../../components/ui/callout";
import TechBackground from "../../../components/ui/tech-background";
import Reveal from "../../../components/ui/reveal";
import { DetailBackLink } from "../../../components/ui/detail-layout";
import { EmailForm, NameForm, PasswordForm } from "./profile-forms";

type SearchParams = Record<string, string | string[] | undefined>;

export default function PerfilPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<div className="mx-auto mt-24 h-96 max-w-3xl animate-pulse rounded-2xl bg-unis-bg" aria-busy="true" />}>
      <PerfilContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PerfilContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser("/cuenta/perfil");
  const params = await searchParams;
  const role = getUserRole(user);
  const emailPending = param(params.correo);

  return (
    <>
      <div className="relative isolate overflow-hidden bg-unis-red">
        <TechBackground />
        <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <DetailBackLink href="/cuenta">Volver a mi cuenta</DetailBackLink>
          <Reveal>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">Mi perfil</h1>
            <p className="mt-2 max-w-2xl text-base text-white/80">
              Datos de acceso a tu cuenta. Tu foto, presentación y contacto público se editan en el{" "}
              <Link href="/cuenta/perfil-profesional" className="font-semibold text-white underline underline-offset-4">
                perfil profesional
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </div>

      <div className="relative mx-auto -mt-14 max-w-3xl space-y-6 px-4 pb-16 sm:px-6 lg:px-8">
        {emailPending === "enviado" ? (
          <Callout tone="info">
            Te enviamos un enlace de confirmación para cambiar el correo. Revisa tu bandeja de entrada y la carpeta de
            spam; el cambio no se aplica hasta que confirmes en los dos correos.
          </Callout>
        ) : null}

        <Reveal>
          <section className="flex flex-col gap-4 rounded-2xl border border-unis-lightgray bg-white p-6 shadow-lg sm:flex-row sm:items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-unis-cyan/10 text-unis-red ring-1 ring-inset ring-unis-cyan/30">
              <Shield className="h-7 w-7" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-unis-gray">Sesión iniciada como</p>
              <p className="truncate text-lg font-bold text-unis-text">{user.name}</p>
              <p className="truncate text-sm text-unis-gray">
                {user.email} · {ROLE_LABELS[role] ?? role}
              </p>
            </div>
          </section>
        </Reveal>

        <AccountSection icon={User} title="Datos personales" description={`Tipo de cuenta: ${ROLE_LABELS[role] ?? role}. Solo un administrador puede cambiarlo.`}>
          <NameForm defaultName={user.name} />
        </AccountSection>

        <AccountSection icon={Mail} title="Correo electrónico" description="Lo usas para iniciar sesión y para recibir avisos de postulaciones.">
          <EmailForm currentEmail={user.email} />
        </AccountSection>

        <AccountSection
          icon={KeyRound}
          title="Contraseña"
          description={
            <>
              Si olvidaste la actual, cierra sesión y usa{" "}
              <Link href="/recuperar" className="font-medium text-unis-red hover:underline">
                recuperar contraseña
              </Link>
              .
            </>
          }
        >
          <PasswordForm />
        </AccountSection>
      </div>
    </>
  );
}

function AccountSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <section className="rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-6 flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-unis-cyan/10 text-unis-red ring-1 ring-inset ring-unis-cyan/30">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-unis-text">{title}</h2>
            <p className="mt-1 text-sm text-unis-gray">{description}</p>
          </div>
        </header>
        {children}
      </section>
    </Reveal>
  );
}
