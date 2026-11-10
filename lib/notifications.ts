import type { notification_type } from "@prisma/client";
import { prisma } from "./prisma";

export type NotificationData = {
  userId: string;
  type: notification_type;
  title: string;
  body?: string | null;
  href?: string | null;
};

/**
 * Crea avisos internos. Nunca lanza: una notificación que falla no debe tumbar
 * la acción principal (postularse, aprobar una publicación, etc.).
 */
export async function notifyUsers(items: NotificationData[]): Promise<void> {
  if (items.length === 0) return;

  try {
    await prisma.notifications.createMany({
      data: items.map(({ userId, ...rest }) => ({ user_id: userId, ...rest })),
    });
  } catch (error) {
    console.error("No se pudo crear la notificación interna:", error);
  }
}

/** Avisa a todos los administradores, opcionalmente exceptuando a quien origina el aviso. */
export async function notifyAdmins(
  input: Omit<NotificationData, "userId"> & { exceptUserId?: string }
): Promise<void> {
  try {
    const admins = await prisma.users.findMany({ where: { role: "admin" }, select: { id: true } });
    const { exceptUserId, ...rest } = input;
    await notifyUsers(
      admins.filter((admin) => admin.id !== exceptUserId).map((admin) => ({ ...rest, userId: admin.id }))
    );
  } catch (error) {
    console.error("No se pudo avisar a los administradores:", error);
  }
}
