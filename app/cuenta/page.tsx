import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "../../lib/session";
import { ROLE_LABELS, STATUS_LABELS } from "../../lib/roles";
import SignOutButton from "../../components/auth/sign-out-button";

export default function CuentaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<CuentaSkeleton />}>
        <CuentaContent />
      </Suspense>
    </div>
  );
}

async function CuentaContent() {
  const user = await requireUser("/cuenta");

  const role = (user as { role?: string }).role ?? "";
  const status = (user as { status?: string }).status ?? "pending";

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

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/publicaciones"
          className="rounded-md bg-unis-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
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
