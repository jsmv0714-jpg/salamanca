"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/session";
import { getUserRole, getUserStatus } from "../../lib/permissions";
import { slugify } from "../../lib/slug";
import { deleteMedia, thumbKeyFor } from "../../lib/storage";
import { todayInBogota } from "../../lib/dates";
import {
  UUID_RE,
  getString,
  getStringList,
  isEmail,
  type FormState,
} from "../../lib/validation";
import {
  RESERVED_SLUGS,
  isAuthorRole,
  isModality,
  type Modality,
  type PublicationStatus,
} from "../../lib/publications";

const TEXT_FIELDS = [
  "publication_type_id",
  "title",
  "description",
  "requirements",
  "benefits",
  "location",
  "modality",
  "deadline",
  "contact_email",
  "contact_phone",
] as const;

type PublicationInput = {
  publication_type_id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  location: string | null;
  modality: Modality | null;
  deadline: Date | null;
  contact_email: string | null;
  contact_phone: string | null;
  show_contact: boolean;
  sector_ids: string[];
  career_ids: string[];
  area_ids: string[];
};

type Parsed = { ok: true; data: PublicationInput } | { ok: false; state: FormState };

async function existingIds(
  ids: string[],
  find: (ids: string[]) => Promise<{ id: string }[]>
): Promise<string[]> {
  const valid = ids.filter((id) => UUID_RE.test(id));
  if (valid.length === 0) return [];
  return (await find(valid)).map((r) => r.id);
}

async function parsePublicationForm(formData: FormData): Promise<Parsed> {
  const values: Record<string, string | string[]> = {};
  for (const key of TEXT_FIELDS) values[key] = getString(formData, key);
  values.sector_ids = getStringList(formData, "sector_ids");
  values.career_ids = getStringList(formData, "career_ids");
  values.area_ids = getStringList(formData, "area_ids");
  const showContact = formData.get("show_contact") === "on";
  values.show_contact = showContact ? "on" : "";

  const text = (key: (typeof TEXT_FIELDS)[number]) => values[key] as string;
  const errors: Record<string, string> = {};

  const typeId = text("publication_type_id");
  const type = UUID_RE.test(typeId)
    ? await prisma.publication_types.findFirst({
        where: { id: typeId, is_active: true },
        select: { id: true },
      })
    : null;
  if (!type) errors.publication_type_id = "Elige un tipo de publicación.";

  const title = text("title");
  if (title.length < 5 || title.length > 200) errors.title = "El título debe tener entre 5 y 200 caracteres.";

  const description = text("description");
  if (description.length < 30 || description.length > 5000) {
    errors.description = "La descripción debe tener entre 30 y 5000 caracteres.";
  }

  const requirements = text("requirements");
  if (requirements.length > 3000) errors.requirements = "Máximo 3000 caracteres.";
  const benefits = text("benefits");
  if (benefits.length > 3000) errors.benefits = "Máximo 3000 caracteres.";

  const location = text("location");
  if (location.length > 150) errors.location = "Máximo 150 caracteres.";

  const modalityText = text("modality");
  if (modalityText && !isModality(modalityText)) errors.modality = "Elige una opción válida.";

  let deadline: Date | null = null;
  if (text("deadline")) {
    const raw = text("deadline");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) {
      errors.deadline = "Escribe una fecha válida.";
    } else if (raw < todayInBogota()) {
      errors.deadline = "La fecha límite no puede ser anterior a hoy.";
    } else {
      deadline = new Date(`${raw}T00:00:00.000Z`);
    }
  }

  const email = text("contact_email");
  if (email && (!isEmail(email) || email.length > 150)) errors.contact_email = "Escribe un correo válido.";
  const phone = text("contact_phone");
  if (phone.length > 50) errors.contact_phone = "Máximo 50 caracteres.";

  const [sectorIds, careerIds, areaIds] = await Promise.all([
    existingIds(values.sector_ids as string[], (ids) =>
      prisma.sectors.findMany({ where: { id: { in: ids }, is_active: true }, select: { id: true } })
    ),
    existingIds(values.career_ids as string[], (ids) =>
      prisma.careers.findMany({ where: { id: { in: ids }, is_active: true }, select: { id: true } })
    ),
    existingIds(values.area_ids as string[], (ids) =>
      prisma.areas_of_expertise.findMany({ where: { id: { in: ids }, is_active: true }, select: { id: true } })
    ),
  ]);

  if (Object.keys(errors).length > 0) {
    return { ok: false, state: { error: "Revisa los campos marcados.", fieldErrors: errors, values } };
  }

  return {
    ok: true,
    data: {
      publication_type_id: typeId,
      title,
      description,
      requirements: requirements || null,
      benefits: benefits || null,
      location: location || null,
      modality: isModality(modalityText) ? modalityText : null,
      deadline,
      contact_email: email || null,
      contact_phone: phone || null,
      show_contact: showContact,
      sector_ids: sectorIds,
      career_ids: careerIds,
      area_ids: areaIds,
    },
  };
}

async function uniqueSlug(title: string): Promise<string> {
  let root = slugify(title);
  if (RESERVED_SLUGS.includes(root)) root = `${root}-publicacion`;
  for (let i = 1; i <= 20; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const taken = await prisma.publications.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

export async function createPublication(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/publicaciones/nueva");

  const role = getUserRole(user);
  if (!isAuthorRole(role)) return { error: "Tu tipo de cuenta no puede crear publicaciones." };
  if (getUserStatus(user) !== "active") {
    return { error: "Tu cuenta debe estar activa para publicar. Un administrador debe activarla." };
  }

  const parsed = await parsePublicationForm(formData);
  if (!parsed.ok) return parsed.state;

  const { sector_ids, career_ids, area_ids, ...data } = parsed.data;
  const status: PublicationStatus = getString(formData, "intent") === "review" ? "in_review" : "draft";

  let slug = await uniqueSlug(data.title);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.publications.create({
        data: {
          ...data,
          slug,
          user_id: user.id,
          author_type: role,
          status,
          publication_sectors: { create: sector_ids.map((sector_id) => ({ sector_id })) },
          publication_careers: { create: career_ids.map((career_id) => ({ career_id })) },
          publication_areas: { create: area_ids.map((area_id) => ({ area_id })) },
        },
      });
      break;
    } catch (error) {
      if (isUniqueViolation(error) && attempt < 2) {
        slug = `${slugify(data.title)}-${Math.random().toString(36).slice(2, 7)}`;
        continue;
      }
      return { error: "No se pudo guardar la publicación. Intenta de nuevo." };
    }
  }

  redirect(`/publicaciones/${slug}`);
}

export async function updatePublication(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/publicaciones/${slug}/editar`)}`);

  const publication = await prisma.publications.findUnique({ where: { slug } });
  if (!publication || publication.user_id !== user.id) {
    return { error: "No tienes permiso para editar esta publicación." };
  }
  if (getUserStatus(user) !== "active") {
    return { error: "Tu cuenta debe estar activa para editar publicaciones." };
  }

  const parsed = await parsePublicationForm(formData);
  if (!parsed.ok) return parsed.state;

  const { sector_ids, career_ids, area_ids, ...data } = parsed.data;

  // Quien publica nunca se salta la revisión: si ya estaba aprobada o cerrada,
  // cualquier cambio la devuelve a "en revisión".
  let status: PublicationStatus;
  if (publication.status === "published" || publication.status === "closed") {
    status = "in_review";
  } else {
    status = getString(formData, "intent") === "review" ? "in_review" : "draft";
  }

  try {
    await prisma.publications.update({
      where: { id: publication.id },
      data: {
        ...data,
        status,
        rejection_reason: null,
        publication_sectors: { deleteMany: {}, create: sector_ids.map((sector_id) => ({ sector_id })) },
        publication_careers: { deleteMany: {}, create: career_ids.map((career_id) => ({ career_id })) },
        publication_areas: { deleteMany: {}, create: area_ids.map((area_id) => ({ area_id })) },
      },
    });
  } catch {
    return { error: "No se pudieron guardar los cambios. Intenta de nuevo." };
  }

  redirect(`/publicaciones/${slug}`);
}

/** Cierra una publicación (deja de recibir postulaciones) o la reabre. */
export async function setPublicationClosed(slug: string, close: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent("/cuenta/publicaciones")}`);

  const publication = await prisma.publications.findUnique({
    where: { slug },
    select: { id: true, user_id: true, status: true },
  });
  if (publication && publication.user_id === user.id) {
    if (close && publication.status === "published") {
      await prisma.publications.update({ where: { id: publication.id }, data: { status: "closed" } });
    } else if (!close && publication.status === "closed") {
      await prisma.publications.update({ where: { id: publication.id }, data: { status: "published" } });
    }
  }
  redirect("/cuenta/publicaciones");
}

export async function deletePublication(slug: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/publicaciones/${slug}`)}`);

  const publication = await prisma.publications.findUnique({
    where: { slug },
    select: { id: true, user_id: true, publication_media: { select: { storage_key: true, thumb_key: true } } },
  });
  const isAdmin = getUserRole(user) === "admin";
  if (!publication || (publication.user_id !== user.id && !isAdmin)) redirect("/publicaciones");

  await prisma.publications.delete({ where: { id: publication.id } });

  // La BD borra las filas en cascada; los archivos hay que quitarlos del almacenamiento.
  await Promise.all(
    publication.publication_media.flatMap((media) => {
      const keys = [media.storage_key, media.thumb_key ?? thumbKeyFor(media.storage_key)];
      return keys.map((key) =>
        deleteMedia(key).catch((error) => {
          console.error("No se pudo borrar un archivo de la publicación eliminada:", error);
        })
      );
    })
  );
  redirect(isAdmin && publication.user_id !== user.id ? "/admin/publicaciones" : "/cuenta/publicaciones");
}
