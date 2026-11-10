import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { formatDateTime } from "../../../lib/dates";
import { secondaryButtonClass } from "../../../components/ui/form";
import NotificationSync from "../../../components/notifications/notification-sync";
import { markAllNotificationsRead, openNotification } from "./actions";

export default function NotificacionesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
        <NotificacionesContent />
      </Suspense>
    </div>
  );
}

async function NotificacionesContent() {
  const user = await requireUser("/cuenta/notificaciones");

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

      <Link href="/cuenta" className="text-sm font-medium text-unis-gray hover:text-unis-red">
        ← Volver a mi cuenta
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-unis-text">Notificaciones</h1>
          <p className="mt-2 text-base text-unis-gray">
            {unread === 0
              ? "Estás al día: no tienes avisos sin leer."
              : `${unread} ${unread === 1 ? "aviso sin leer" : "avisos sin leer"}.`}
          </p>
        </div>

        {unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <button type="submit" className={secondaryButtonClass}>
              Marcar todas como leídas
            </button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-unis-lightgray px-6 py-10 text-center text-sm text-unis-gray">
          Aquí verás los avisos de postulaciones, decisiones sobre tus publicaciones y reportes.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {notifications.map((notification) => {
            const isUnread = notification.read_at === null;

            return (
              <li
                key={notification.id}
                className={`rounded-lg border bg-white p-5 shadow-sm ${
                  isUnread ? "border-unis-cyan" : "border-unis-lightgray"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-unis-text">{notification.title}</h2>
                      {isUnread ? (
                        <span className="rounded-full bg-unis-cyan/15 px-2.5 py-0.5 text-xs font-semibold text-[#0A7F9E]">
                          Nuevo
                        </span>
                      ) : null}
                    </div>
                    {notification.body ? (
                      <p className="mt-2 text-sm leading-relaxed text-unis-gray">{notification.body}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-unis-gray">{formatDateTime(notification.created_at)}</p>
                  </div>

                  <form action={openNotification}>
                    <input type="hidden" name="id" value={notification.id} />
                    <button type="submit" className="text-sm font-semibold text-unis-red hover:underline">
                      {notification.href ? "Abrir" : "Marcar como leída"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
