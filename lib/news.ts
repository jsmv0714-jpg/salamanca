import { slugify } from "./slug";
import { isHttpUrl, normalizeUrl } from "./validation";

/**
 * Noticias, comunicados y eventos de la institución. Este archivo no usa Prisma
 * para que lo puedan importar también los formularios y las pruebas.
 */

export const NEWS_TYPES = ["news", "event", "announcement"] as const;
export type NewsType = (typeof NEWS_TYPES)[number];

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  news: "Noticia",
  event: "Evento",
  announcement: "Comunicado",
};

export const NEWS_LIMITS = {
  title: 200,
  summary: 400,
  body: 20000,
  location: 200,
  url: 500,
} as const;

export const NEWS_PAGE_SIZE = 12;

export function isNewsType(value: unknown): value is NewsType {
  return typeof value === "string" && (NEWS_TYPES as readonly string[]).includes(value);
}

/**
 * Convierte "AAAA-MM-DDTHH:mm" (hora de Colombia, UTC-5 todo el año) en una fecha real.
 * Devuelve null si el texto no tiene ese formato o no es una fecha válida.
 */
export function parseEventDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(`${value}:00-05:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Slug legible con un sufijo corto para que dos noticias con el mismo título no choquen. */
export function makeNewsSlug(title: string, suffix: string): string {
  const base = slugify(title).slice(0, 200).replace(/-+$/g, "");
  return `${base}-${suffix}`;
}

export type NewsInput = {
  type: string;
  title: string;
  summary: string;
  body: string;
  eventDate: string;
  eventLocation: string;
  eventUrl: string;
};

export type NewsValidation =
  | {
      ok: true;
      value: {
        type: NewsType;
        title: string;
        summary: string;
        body: string;
        eventStartsAt: Date | null;
        eventLocation: string | null;
        eventUrl: string | null;
      };
    }
  | { ok: false; fieldErrors: Record<string, string> };

/** Revisa los campos del formulario de una noticia. Los mensajes van en español. */
export function validateNews(input: NewsInput): NewsValidation {
  const errors: Record<string, string> = {};
  const title = input.title.replace(/\s+/g, " ").trim();
  const summary = input.summary.trim();
  const body = input.body.trim();

  if (!isNewsType(input.type)) errors.type = "Elige el tipo de publicación.";
  if (title.length < 5) errors.title = "El título debe tener al menos 5 caracteres.";
  else if (title.length > NEWS_LIMITS.title) errors.title = `Máximo ${NEWS_LIMITS.title} caracteres.`;
  if (summary.length < 10) errors.summary = "El resumen debe tener al menos 10 caracteres.";
  else if (summary.length > NEWS_LIMITS.summary) errors.summary = `Máximo ${NEWS_LIMITS.summary} caracteres.`;
  if (body.length < 20) errors.body = "El contenido debe tener al menos 20 caracteres.";
  else if (body.length > NEWS_LIMITS.body) errors.body = `Máximo ${NEWS_LIMITS.body} caracteres.`;

  let eventStartsAt: Date | null = null;
  let eventLocation: string | null = null;
  let eventUrl: string | null = null;

  if (isNewsType(input.type) && input.type === "event") {
    eventStartsAt = parseEventDate(input.eventDate);
    if (!eventStartsAt) errors.eventDate = "Indica la fecha y la hora del evento.";

    eventLocation = input.eventLocation.trim() || null;
    if (eventLocation && eventLocation.length > NEWS_LIMITS.location) {
      errors.eventLocation = `Máximo ${NEWS_LIMITS.location} caracteres.`;
    }

    const url = normalizeUrl(input.eventUrl.trim());
    if (url && (!isHttpUrl(url) || url.length > NEWS_LIMITS.url)) {
      errors.eventUrl = "Escribe un enlace válido que empiece por https://.";
    }
    eventUrl = url || null;
  }

  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };

  return {
    ok: true,
    value: {
      type: input.type as NewsType,
      title,
      summary,
      body,
      eventStartsAt: input.type === "event" ? eventStartsAt : null,
      eventLocation,
      eventUrl,
    },
  };
}
