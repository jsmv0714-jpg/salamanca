"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { UUID_RE, getString } from "../../../lib/validation";

const NOTIFICATIONS_PATH = "/cuenta/notificaciones";

/** Solo se aceptan rutas internas: evita que un aviso manipulado lleve a otro sitio. */
function safeHref(href: string | null): string {
  return href && href.startsWith("/") && !href.startsWith("//") ? href : NOTIFICATIONS_PATH;
}

function revalidateNotifications() {
  revalidatePath(NOTIFICATIONS_PATH);
  revalidatePath("/cuenta");
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(NOTIFICATIONS_PATH)}`);

  await prisma.notifications.updateMany({
    where: { user_id: user.id, read_at: null },
    data: { read_at: new Date() },
  });

  revalidateNotifications();
  redirect(NOTIFICATIONS_PATH);
}

/** Abre un aviso (lo marca como leído) y lleva a su destino. */
export async function openNotification(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(NOTIFICATIONS_PATH)}`);

  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect(NOTIFICATIONS_PATH);

  const notification = await prisma.notifications.findFirst({
    where: { id, user_id: user.id },
    select: { id: true, href: true, read_at: true },
  });
  if (!notification) redirect(NOTIFICATIONS_PATH);

  if (!notification.read_at) {
    await prisma.notifications.update({ where: { id: notification.id }, data: { read_at: new Date() } });
    revalidateNotifications();
  }

  redirect(safeHref(notification.href));
}
