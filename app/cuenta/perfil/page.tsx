import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import { ROLE_LABELS } from "../../../lib/roles";
import { param } from "../../../lib/query";
import Callout from "../../../components/ui/callout";
import { EmailForm, NameForm, PasswordForm } from "./profile-forms";

type SearchParams = Record<string, string | string[] | undefined>;

export default function PerfilPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <PerfilContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PerfilContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser("/cuenta/perfil");
  const params = await searchParams;
  const role = getUserRole(user);
  const emailPending = param(params.correo);

  return (
    <>
      <Link href="/cuenta" className="text-sm font-medium text-unis-gray hover:text-unis-red">
        ← Volver a mi cuenta
      </Link>

      <h1 className="mt-3 text-3xl font-black tracking-tight text-unis-text">Mi perfil</h1>
      <p className="mt-2 text-base text-unis-gray">
        Tus datos de acceso al Marketplace. El perfil público del directorio se edita aparte.
      </p>

      {emailPending === "enviado" ? (
        <div className="mt-6">
          <Callout tone="info">
            Te enviamos un enlace de confirmación para cambiar el correo. Revisa tu bandeja de entrada y la carpeta de
            spam; el cambio no se aplica hasta que confirmes en los dos correos.
          </Callout>
        </div>
      ) : null}

      <div className="mt-8 space-y-6">
        <section className="rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-unis-text">Datos personales</h2>
          <p className="mt-1 text-sm text-unis-gray">
            Tipo de cuenta: {ROLE_LABELS[role] ?? role}. El tipo de cuenta solo lo puede cambiar un administrador.
          </p>
          <div className="mt-5">
            <NameForm defaultName={user.name} />
          </div>
        </section>

        <section className="rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-unis-text">Correo electrónico</h2>
          <p className="mt-1 text-sm text-unis-gray">
            Lo usas para iniciar sesión y para recibir avisos de postulaciones.
          </p>
          <div className="mt-5">
            <EmailForm currentEmail={user.email} />
          </div>
        </section>

        <section className="rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-unis-text">Contraseña</h2>
          <p className="mt-1 text-sm text-unis-gray">
            Si olvidaste la actual, cierra sesión y usa{" "}
            <Link href="/recuperar" className="font-medium text-unis-red hover:underline">
              recuperar contraseña
            </Link>
            .
          </p>
          <div className="mt-5">
            <PasswordForm />
          </div>
        </section>
      </div>
    </>
  );
}
