import { prisma } from "./prisma";
import { appUrl, sendBatchEmails, type EmailMessage } from "./email";
import { formatDateTime } from "./dates";
import { NEWS_TYPE_LABELS, isNewsType } from "./news";
import { isEmail } from "./validation";

const SUBJECT_PREFIX = {
  news: "Nueva noticia",
  event: "Nuevo evento",
  announcement: "Nuevo comunicado",
} as const;

/**
 * Avisa por correo a las personas registradas cuando se publica una noticia.
 * Solo se envía una vez por noticia: el registro se reclama antes de enviar, así
 * que dos clics seguidos en "Publicar" no duplican los correos.
 */
export async function notifyNewsPublished(newsId: string): Promise<void> {
  try {
    const claimed = await prisma.news.updateMany({
      where: { id: newsId, status: "published", emails_sent_at: null },
      data: { emails_sent_at: new Date() },
    });
    if (claimed.count === 0) return;

    const news = await prisma.news.findUnique({
      where: { id: newsId },
      select: { type: true, title: true, summary: true, slug: true, event_starts_at: true, event_location: true },
    });
    if (!news || !isNewsType(news.type)) return;

    const recipients = await prisma.users.findMany({
      where: { email_verified: true, notify_news: true, status: { not: "suspended" } },
      select: { email: true, name: true },
    });

    const base = appUrl();
    const link = `${base}/noticias/${news.slug}`;
    const preferences = `${base}/cuenta/notificaciones`;
    const subject = `${SUBJECT_PREFIX[news.type]}: ${news.title} | Unisalamanca Marketplace`;

    const messages: EmailMessage[] = recipients.filter((recipient) => isEmail(recipient.email)).map((recipient) => {
      const greeting = `Hola${recipient.name ? ` ${recipient.name.trim().split(/\s+/)[0]}` : ""},`;
      const eventLines =
        news.type === "event" && news.event_starts_at
          ? [
              `Fecha: ${formatDateTime(news.event_starts_at)}`,
              news.event_location ? `Lugar: ${news.event_location}` : null,
            ].filter(Boolean)
          : [];

      return {
        to: recipient.email,
        subject,
        text: [
          greeting,
          "",
          `${NEWS_TYPE_LABELS[news.type]}: ${news.title}`,
          news.summary,
          ...eventLines,
          "",
          `Léela completa aquí: ${link}`,
          "",
          `Dejar de recibir estos correos: ${preferences}`,
        ].join("\n"),
      };
    });

    const result = await sendBatchEmails(messages);
    await prisma.news.update({ where: { id: newsId }, data: { emails_sent_count: result.sent } });
  } catch (error) {
    console.error("No se pudieron enviar los avisos de la noticia:", error);
  }
}
