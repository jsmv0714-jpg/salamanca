"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { getUserRole, getUserStatus } from "../../../lib/permissions";
import {
  UUID_RE,
  getString,
  getStringList,
  isEmail,
  isHttpUrl,
  normalizeUrl,
  type FormState,
} from "../../../lib/validation";
import { isBusinessModel, isDirectoryRole } from "../../../lib/ventures";

const TEXT_FIELDS = [
  "display_name",
  "headline",
  "core_expertise",
  "business_model",
  "sector_id",
  "city",
  "website",
  "linkedin_url",
  "logo_url",
  "contact_email",
] as const;

export async function saveDirectoryProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/cuenta/directorio");
  if (!isDirectoryRole(getUserRole(user))) {
    return { error: "Tu tipo de cuenta no aparece en el directorio." };
  }
  if (getUserStatus(user) !== "active") {
    return { error: "Tu cuenta debe estar activa para editar tu perfil del directorio. Un administrador debe activarla." };
  }

  const values: Record<string, string | string[]> = {};
  for (const key of TEXT_FIELDS) values[key] = getString(formData, key);
  values.area_ids = getStringList(formData, "area_ids");
  const isVisible = formData.get("is_visible") === "on";
  values.is_visible = isVisible ? "on" : "";

  const text = (key: (typeof TEXT_FIELDS)[number]) => values[key] as string;
  const errors: Record<string, string> = {};

  if (text("display_name").length > 200) errors.display_name = "Máximo 200 caracteres.";
  if (text("headline").length > 200) errors.headline = "Máximo 200 caracteres.";
  if (text("core_expertise").length > 2000) errors.core_expertise = "Máximo 2000 caracteres.";
  if (text("city").length > 100) errors.city = "Máximo 100 caracteres.";

  const modelText = text("business_model");
  if (modelText && !isBusinessModel(modelText)) errors.business_model = "Elige una opción válida.";

  if (isVisible && text("headline").length + text("core_expertise").length < 10) {
    errors.headline = "Para aparecer en el directorio describe brevemente qué haces o qué asesoría ofreces.";
  }

  const urls = {
    website: normalizeUrl(text("website")),
    linkedin_url: normalizeUrl(text("linkedin_url")),
    logo_url: normalizeUrl(text("logo_url")),
  };
  for (const key of ["website", "linkedin_url", "logo_url"] as const) {
    if (urls[key] && (!isHttpUrl(urls[key]) || urls[key].length > 500)) {
      errors[key] = "Escribe un enlace válido que empiece por http:// o https://.";
    }
  }

  const email = text("contact_email");
  if (email && (!isEmail(email) || email.length > 150)) errors.contact_email = "Escribe un correo válido.";

  let sectorId: string | null = null;
  if (text("sector_id")) {
    const id = text("sector_id");
    const sector = UUID_RE.test(id)
      ? await prisma.sectors.findFirst({ where: { id, is_active: true }, select: { id: true } })
      : null;
    if (!sector) errors.sector_id = "Elige un sector de la lista.";
    else sectorId = sector.id;
  }

  const requestedAreas = (values.area_ids as string[]).filter((id) => UUID_RE.test(id));
  const areas = requestedAreas.length
    ? await prisma.areas_of_expertise.findMany({
        where: { id: { in: requestedAreas }, is_active: true },
        select: { id: true },
      })
    : [];

  if (Object.keys(errors).length > 0) {
    return { error: "Revisa los campos marcados.", fieldErrors: errors, values };
  }

  const data = {
    display_name: text("display_name") || null,
    headline: text("headline") || null,
    core_expertise: text("core_expertise") || null,
    business_model: isBusinessModel(modelText) ? modelText : null,
    sector_id: sectorId,
    city: text("city") || null,
    website: urls.website || null,
    linkedin_url: urls.linkedin_url || null,
    logo_url: urls.logo_url || null,
    contact_email: email || null,
    is_visible: isVisible,
  };

  try {
    await prisma.$transaction(async (tx) => {
      const profile = await tx.directory_profiles.upsert({
        where: { user_id: user.id },
        create: { ...data, user_id: user.id },
        update: data,
        select: { id: true },
      });
      await tx.directory_profile_areas.deleteMany({ where: { profile_id: profile.id } });
      if (areas.length > 0) {
        await tx.directory_profile_areas.createMany({
          data: areas.map((a) => ({ profile_id: profile.id, area_id: a.id })),
        });
      }
    });
  } catch {
    return { error: "No se pudo guardar tu perfil. Intenta de nuevo.", values };
  }

  redirect("/cuenta/directorio?guardado=1");
}
