import { Suspense } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/permissions";
import { buildQuery, param } from "../../../lib/query";
import { formatDate } from "../../../lib/dates";
import { ROLE_LABELS } from "../../../lib/roles";
import {
  USER_ROLES,
  USER_STATUSES,
  USER_STATUS_LABELS,
  isUserRole,
  isUserStatus,
  type UserStatus,
} from "../../../lib/admin";
import Badge, { type BadgeTone } from "../../../components/ui/badge";
import Callout from "../../../components/ui/callout";
import ConfirmButton from "../../../components/ui/confirm-button";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../../../components/ui/form";
import { ROLE_CHANGE_MESSAGES, type RoleChangeFailure } from "../../../lib/admin-roles";
import { setUserRole, setUserStatus } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

const STATUS_TONES: Record<UserStatus, BadgeTone> = { pending: "amber", active: "green", suspended: "danger" };
const STATUS_SINGULAR: Record<UserStatus, string> = { pending: "Pendiente", active: "Activa", suspended: "Suspendida" };
const ROLE_CHANGE_SUCCESS: Record<string, string> = {
  promoted: "La cuenta ahora es administradora. Le enviamos un correo con el aviso.",
  demoted: "Se retiró el rol de administrador. La cuenta conserva el rol que tenía antes.",
};

export default function AdminUsuariosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <AdminUsuariosContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminUsuariosContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const admin = await requireAdmin("/admin/usuarios");
  const raw = await searchParams;

  const requested = param(raw.estado);
  const estado: UserStatus = isUserStatus(requested) ? requested : "pending";
  const rolParam = param(raw.rol);
  const rol = isUserRole(rolParam) ? rolParam : undefined;
  const q = param(raw.q);
  const ajuste = param(raw.ajuste);

  const where: Prisma.usersWhereInput = { status: estado, role: { not: "admin" } };
  if (rol && rol !== "admin") where.role = rol;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, grouped, admins, roleChanges] = await Promise.all([
    prisma.users.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 100,
      select: { id: true, name: true, email: true, role: true, status: true, created_at: true },
    }),
    prisma.users.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.users.findMany({
      where: { role: "admin" },
      orderBy: { created_at: "asc" },
      select: { id: true, name: true, email: true, status: true, created_at: true },
    }),
    prisma.role_changes.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      select: {
        id: true,
        from_role: true,
        to_role: true,
        created_at: true,
        users: { select: { name: true, email: true } },
        changed_by: { select: { name: true, email: true } },
      },
    }),
  ]);

  const feedback = ajuste
    ? ROLE_CHANGE_SUCCESS[ajuste]
      ? { tone: "success" as const, text: ROLE_CHANGE_SUCCESS[ajuste] }
      : ajuste in ROLE_CHANGE_MESSAGES
        ? { tone: "error" as const, text: ROLE_CHANGE_MESSAGES[ajuste as RoleChangeFailure] }
        : null
    : null;

  const counts = new Map(grouped.map((g) => [g.status, g._count._all]));
  const current = { estado, rol, q };
  const back = `/admin/usuarios${buildQuery(current)}`;

  return (
    <>
      <h1 className="text-3xl font-black tracking-tight text-unis-text">Cuentas de usuario</h1>
      <p className="mt-2 text-base text-unis-gray">
        Activa las cuentas nuevas para que puedan publicar, postularse y aparecer en el directorio.
      </p>

      {feedback ? (
        <div className="mt-4">
          <Callout tone={feedback.tone}>{feedback.text}</Callout>
        </div>
      ) : null}

      <section className="mt-6 rounded-lg border border-unis-lightgray bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-unis-text">Administradores</h2>
            <p className="mt-1 text-xs text-unis-gray">
              Pueden aprobar publicaciones y gestionar cuentas. Siempre debe quedar al menos uno y solo otro
              administrador puede retirar el rol.
            </p>
          </div>
          <Badge tone="amber">{admins.length === 1 ? "1 administrador" : `${admins.length} administradores`}</Badge>
        </div>

        <ul className="mt-4 divide-y divide-unis-lightgray">
          {admins.map((account) => {
            const accountStatus = isUserStatus(account.status) ? account.status : "pending";
            const isSelf = account.id === admin.id;
            return (
              <li key={account.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-unis-text">
                    {account.name || "Sin nombre"} {isSelf ? <span className="font-normal text-unis-gray">(tú)</span> : null}
                  </p>
                  <p className="truncate text-xs text-unis-gray">{account.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONES[accountStatus]}>{STATUS_SINGULAR[accountStatus]}</Badge>
                  {isSelf ? (
                    <span className="text-xs text-unis-gray">No puedes quitarte el rol.</span>
                  ) : admins.length <= 1 ? (
                    <span className="text-xs text-unis-gray">Es el único administrador.</span>
                  ) : (
                    <form action={setUserRole}>
                      <input type="hidden" name="id" value={account.id} />
                      <input type="hidden" name="role" value="demote" />
                      <input type="hidden" name="back" value={back} />
                      <ConfirmButton
                        message={`¿Quitar el rol de administrador a ${account.name || account.email}? Su cuenta seguirá activa con el rol anterior.`}
                        className={secondaryButtonClass}
                      >
                        Quitar administrador
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        {USER_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/usuarios${buildQuery({ ...current, estado: status })}`}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              status === estado
                ? "bg-unis-red/5 font-semibold text-unis-red ring-1 ring-unis-red/30"
                : "text-unis-gray ring-1 ring-unis-lightgray hover:text-unis-text"
            }`}
          >
            {USER_STATUS_LABELS[status]} ({counts.get(status) ?? 0})
          </Link>
        ))}
      </nav>

      <form action="/admin/usuarios" method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="estado" value={estado} />
        <div>
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-unis-gray">
            Buscar por nombre o correo
          </label>
          <input id="q" name="q" type="search" defaultValue={q ?? ""} className={`${inputClass} w-64`} />
        </div>
        <div>
          <label htmlFor="rol" className="mb-1 block text-xs font-medium text-unis-gray">
            Tipo de cuenta
          </label>
          <select id="rol" name="rol" defaultValue={rol ?? ""} className={`${inputClass} w-52`}>
            <option value="">Todos</option>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] ?? r}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={secondaryButtonClass}>
          Filtrar
        </button>
        {q || rol ? (
          <Link href={`/admin/usuarios?estado=${estado}`} className="pb-2 text-xs font-medium text-unis-red hover:underline">
            Limpiar
          </Link>
        ) : null}
      </form>

      {users.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-unis-lightgray py-14 text-center text-sm text-unis-gray">
          {rol === "admin"
            ? "Los administradores se muestran en la sección de arriba."
            : `No hay cuentas ${USER_STATUS_LABELS[estado].toLowerCase()} con estos filtros.`}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {users.map((user) => {
            const userStatus = isUserStatus(user.status) ? user.status : "pending";
            return (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-unis-lightgray bg-white p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-unis-text">{user.name || "Sin nombre"}</p>
                  <p className="truncate text-sm text-unis-gray">{user.email}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-unis-gray">
                    <Badge>{ROLE_LABELS[user.role] ?? user.role}</Badge>
                    <Badge tone={STATUS_TONES[userStatus]}>{STATUS_SINGULAR[userStatus]}</Badge>
                    <span>Registro: {formatDate(user.created_at)}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {userStatus !== "active" ? (
                    <form action={setUserStatus}>
                      <input type="hidden" name="id" value={user.id} />
                      <input type="hidden" name="status" value="active" />
                      <input type="hidden" name="back" value={back} />
                      <button type="submit" className={primaryButtonClass}>
                        Activar
                      </button>
                    </form>
                  ) : null}
                  {userStatus !== "suspended" ? (
                    <form action={setUserStatus}>
                      <input type="hidden" name="id" value={user.id} />
                      <input type="hidden" name="status" value="suspended" />
                      <input type="hidden" name="back" value={back} />
                      <button type="submit" className={secondaryButtonClass}>
                        Suspender
                      </button>
                    </form>
                  ) : null}
                  <form action={setUserRole}>
                    <input type="hidden" name="id" value={user.id} />
                    <input type="hidden" name="role" value="promote" />
                    <input type="hidden" name="back" value={back} />
                    <ConfirmButton
                      message={`¿Dar permisos de administrador a ${user.name || user.email}? Podrá aprobar publicaciones y gestionar cuentas.`}
                      className={secondaryButtonClass}
                    >
                      Hacer administrador
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {users.length === 100 ? (
        <p className="mt-4 text-xs text-unis-gray">Se muestran las 100 más recientes. Usa la búsqueda para encontrar otras.</p>
      ) : null}

      {roleChanges.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-unis-text">Últimos cambios de rol</h2>
          <ul className="mt-3 divide-y divide-unis-lightgray rounded-lg border border-unis-lightgray bg-white text-sm shadow-sm">
            {roleChanges.map((change) => (
              <li key={change.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="text-unis-text">
                  <strong>{change.users.name || change.users.email}</strong>: {ROLE_LABELS[change.from_role] ?? change.from_role} →{" "}
                  {ROLE_LABELS[change.to_role] ?? change.to_role}
                </span>
                <span className="text-xs text-unis-gray">
                  {change.changed_by ? `por ${change.changed_by.name || change.changed_by.email}` : "por consola"} ·{" "}
                  {formatDate(change.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
