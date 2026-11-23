"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import { MEDIA_LIMITS, detectMedia } from "../../../lib/media";
import { processNewsCover } from "../../../lib/media-processing";
import { deleteMedia, putMedia } from "../../../lib/storage";
import { makeNewsSlug, validateNews } from "../../../lib/news";
import { notifyNewsPublished } from "../../../lib/news-notify";
import { UUID_RE, getString, type FormState } from "../../../lib/validation";

const LIST_PATH = "/admin/noticias";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || getUserRole(user) !== "admin") return null;
  return user;
}

/** Crea o actualiza una noticia. Con "Publicar" queda visible y se avisa por correo la primera vez. */
export async function saveNews(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await assertAdmin();
  if (!admin) return { error: "Solo los administradores pueden publicar noticias." };

  const id = getString(formData, "id");
  const editing = id !== "";
  if (editing && !UUID_RE.test(id)) return { error: "La noticia no existe." };

  const values: Record<string, string> = {};
  for (const key of ["type", "title", "summary", "body", "event_date", "event_location", "event_url"]) {
    values[key] = getString(formData, key);
  }
  const intent = getString(formData, "intent") === "publish" ? "publish" : "draft";
  const removeCover = formData.get("remove_cover") === "on";

  const existing = editing
    ? await prisma.news.findUnique({
        where: { id },
        select: { id: true, slug: true, status: true, published_at: true, cover_key: true },
      })
    : null;
  if (editing && !existing) return { error: "La noticia no existe." };

  const checked = validateNews({
    type: values.type,
    title: values.title,
    summary: values.summary,
    body: values.body,
    eventDate: values.event_date,
    eventLocation: values.event_location,
    eventUrl: values.event_url,
  });

  const fieldErrors: Record<string, string> = checked.ok ? {} : { ...checked.fieldErrors };

  let newCoverKey: string | null = null;
  const file = formData.get("cover");
  if (file instanceof File && file.size > 0) {
    if (file.size > MEDIA_LIMITS.imageBytes) {
      fieldErrors.cover = "La portada puede pesar hasta 5 MB.";
    } else {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const detected = detectMedia(bytes);
      if (!detected || detected.kind !== "image") {
        fieldErrors.cover = "La portada debe ser una imagen JPG, PNG o WebP.";
      } else {
        try {
          const processed = await processNewsCover(bytes);
          newCoverKey = `news/${randomUUID()}.webp`;
          await putMedia(newCoverKey, processed, "image/webp");
        } catch (error) {
          console.error("No se pudo procesar la portada de la noticia:", error);
          fieldErrors.cover = "No pudimos procesar la imagen. Prueba con otra.";
          newCoverKey = null;
        }
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    if (newCoverKey) await deleteMedia(newCoverKey).catch(() => undefined);
    return { error: "Revisa los campos marcados.", fieldErrors, values };
  }

  if (!checked.ok) return { error: "Revisa los campos marcados.", fieldErrors, values };
  const data = checked.value;

  const publish = intent === "publish";
  const nextCoverKey = newCoverKey ?? (removeCover ? null : (existing?.cover_key ?? null));
  const replacedKey =
    existing?.cover_key && existing.cover_key !== nextCoverKey ? existing.cover_key : null;

  const payload = {
    type: data.type,
    title: data.title,
    summary: data.summary,
    body: data.body,
    cover_key: nextCoverKey,
    status: publish ? ("published" as const) : ("draft" as const),
    published_at: publish ? (existing?.published_at ?? new Date()) : (existing?.published_at ?? null),
    event_starts_at: data.eventStartsAt,
    event_location: data.eventLocation,
    event_url: data.eventUrl,
  };

  let savedId = id;
  try {
    if (existing) {
      await prisma.news.update({ where: { id }, data: payload });
    } else {
      const created = await prisma.news.create({
        data: {
          ...payload,
          author_id: admin.id,
          slug: makeNewsSlug(data.title, randomBytes(3).toString("hex")),
        },
        select: { id: true },
      });
      savedId = created.id;
    }
  } catch (error) {
    console.error("No se pudo guardar la noticia:", error);
    if (newCoverKey) await deleteMedia(newCoverKey).catch(() => undefined);
    return { error: "No se pudo guardar la noticia. Intenta de nuevo.", values };
  }

  if (replacedKey) await deleteMedia(replacedKey).catch(() => undefined);

  if (publish) {
    const notifyId = savedId;
    after(() => notifyNewsPublished(notifyId));
  }

  redirect(`${LIST_PATH}?ok=${publish ? "publicada" : "guardada"}`);
}

/** Elimina una noticia y su portada del almacenamiento. */
export async function deleteNews(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  if (!admin) redirect("/");

  const id = getString(formData, "id");
  if (!UUID_RE.test(id)) redirect(`${LIST_PATH}?error=no-existe`);

  const news = await prisma.news.findUnique({ where: { id }, select: { cover_key: true } });
  if (news) {
    await prisma.news.delete({ where: { id } });
    if (news.cover_key) await deleteMedia(news.cover_key).catch(() => undefined);
  }
  redirect(`${LIST_PATH}?ok=eliminada`);
}
