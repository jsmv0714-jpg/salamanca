import { Suspense } from "react";
import { Bell, BellOff, CheckCircle2, FileCheck, FileX, Flag, Inbox, Send, ShieldAlert, type LucideIcon } from "lucide-react";
import type { notification_type } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { formatDateTime } from "../../../lib/dates";
import NotificationSync from "../../../components/notifications/notification-sync";
import TechBackground from "../../../components/ui/tech-background";
import Reveal from "../../../components/ui/reveal";
import { DetailBackLink } from "../../../components/ui/detail-layout";
import { markAllNotificationsRead, openNotification, updateNewsPreference } from "./actions";
import { param } from "../../../lib/query";
import { FormNotice, primaryButtonClass } from "../../../components/ui/form";

type SearchParams = Record<string, string | string[] | undefined>;

const TYPE_META: Record<notification_type, { icon: LucideIcon; label: string; tone: string }> = {
  application_received: { icon: Inbox, label: "Postulación recibida", tone: "bg-unis-cyan/10 text-unis-blue ring-unis-cyan/30" },
  application_accepted: { icon: CheckCircle2, label: "Postulación aceptada", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  application_rejected: { icon: FileX, label: "Postulación rechazada", tone: "bg-red-50 text-red-700 ring-red-200" },
  publication_approved: { icon: FileCheck, label: "Publicación aprobada", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  publication_rejected: { icon: FileX, label: "Publicación rechazada", tone: "bg-red-50 text-red-700 ring-red-200" },
  report_created: { icon: Flag, label: "Reporte creado", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  report_resolved: { icon: ShieldAlert, label: "Reporte resuelto", tone: "bg-unis-cyan/10 text-unis-blue ring-unis-cyan/30" },
};

export default function NotificacionesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<div className="mx-auto mt-24 h-96 max-w-3xl animate-pulse rounded-2xl bg-unis-bg" aria-busy="true" />}>
      <NotificacionesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NotificacionesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser("/cuenta/notificaciones");
  const params = await searchParams;
  const preferencia = param(params.preferencia);

  const account = await prisma.users.findUnique({ where: { id: user.id }, select: { notify_news: true } });

  const [notifications, unread] = await Promise.all([
    prisma.notifications.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      take: 50,
    }),
    prisma.notifications.count({ where: { user_id: user.id, read_at: null } }),
  ]);

  return (
    <>
      <NotificationSync unread={unread} />

      <div className="relative isolate overflow-hidden bg-unis-red">
        <TechBackground />
        <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <DetailBackLink href="/cuenta">Volver a mi cuenta</DetailBackLink>
          <Reveal>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 ring-1 ring-inset ring-white/20">
                  <Bell className="h-3.5 w-3.5" aria-hidden="true" /> Bandeja
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Notificaciones</h1>
                <p className="mt-2 text-base text-white/80">
                  {unread === 0
                    ? "Estás al día: no tienes avisos sin leer."
                    : `${unread} ${unread === 1 ? "aviso sin leer" : "avisos sin leer"}.`}
                </p>
              </div>
              {unread > 0 ? (
                <form action={markAllNotificationsRead}>
                  <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 transition hover:bg-white/20">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Marcar todas como leídas
                  </button>
                </form>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>

      <div className="relative mx-auto -mt-12 max-w-3xl space-y-6 px-4 pb-16 sm:px-6 lg:px-8">
        <Reveal>
          <form action={updateNewsPreference} className="flex flex-col gap-4 rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="notify_news"
                defaultChecked={account?.notify_news ?? true}
                className="mt-0.5 h-4 w-4 rounded border-unis-lightgray text-unis-red focus:ring-unis-red"
              />
              <span>
                <span className="block text-sm font-semibold text-unis-text">Recibir correos de noticias y eventos</span>
                <span className="block text-xs text-unis-gray">
                  Te avisamos por correo cuando la institución publique una noticia, comunicado o evento.
                </span>
              </span>
            </label>
            <button type="submit" className={primaryButtonClass}>
              Guardar preferencia
            </button>
          </form>
          {preferencia ? (
            <div className="mt-3">
              <FormNotice message={preferencia === "activa" ? "Recibirás los correos de noticias y eventos." : "Ya no recibirás correos de noticias y eventos."} />
            </div>
          ) : null}
        </Reveal>

        {notifications.length === 0 ? (
          <Reveal>
            <div className="rounded-3xl border border-dashed border-unis-lightgray bg-white px-6 py-16 text-center shadow-sm">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-unis-cyan/10 text-unis-red">
                <BellOff className="h-8 w-8" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-lg font-bold text-unis-text">No tienes notificaciones</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-unis-gray">
                Aquí verás los avisos de postulaciones, decisiones sobre tus publicaciones y reportes.
              </p>
            </div>
          </Reveal>
        ) : (
          <ul className="space-y-3">
            {notifications.map((notification, index) => {
              const isUnread = notification.read_at === null;
              const meta = TYPE_META[notification.type] ?? { icon: Send, label: "Aviso", tone: "bg-unis-bg text-unis-gray ring-unis-lightgray" };
              const Icon = meta.icon;

              return (
                <Reveal key={notification.id} delay={Math.min(index * 30, 180)}>
                  <li
                    className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                      isUnread ? "border-unis-cyan/50 ring-1 ring-inset ring-unis-cyan/20" : "border-unis-lightgray"
                    }`}
                  >
                    {isUnread ? <span aria-hidden="true" className="absolute left-0 top-0 h-full w-1.5 bg-unis-cyan" /> : null}
                    <div className="flex gap-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${meta.tone}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-unis-gray">{meta.label}</p>
                              {isUnread ? (
                                <span className="rounded-full bg-unis-cyan/15 px-2 py-0.5 text-[11px] font-semibold text-[#0A7F9E]">
                                  Nuevo
                                </span>
                              ) : null}
                            </div>
                            <h2 className="mt-0.5 text-base font-bold text-unis-text">{notification.title}</h2>
                          </div>
                          <time className="shrink-0 text-xs text-unis-gray">{formatDateTime(notification.created_at)}</time>
                        </div>
                        {notification.body ? (
                          <p className="mt-2 text-sm leading-relaxed text-unis-gray">{notification.body}</p>
                        ) : null}
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <form action={openNotification}>
                            <input type="hidden" name="id" value={notification.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 rounded-full bg-unis-red px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
                            >
                              {notification.href ? "Abrir" : "Marcar como leída"}
                            </button>
                          </form>
                          {notification.href ? (
                            <span className="truncate text-xs text-unis-gray">{notification.href}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
