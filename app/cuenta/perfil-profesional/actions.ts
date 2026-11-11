"use server";

import { redirect } from "next/navigation";
import { Prisma, type student_availability } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { getUserRole, getUserStatus } from "../../../lib/permissions";
import { avatarKeyFromUrl } from "../../../lib/avatar";
import { deleteMedia } from "../../../lib/storage";
import {
  PROFILE_LIMITS,
  ROLE_FIELDS,
  SOCIAL_NETWORKS,
  isAvailability,
  isProfileRole,
  parseSkills,
  socialUrlError,
  splitName,
  type SocialLinks,
} from "../../../lib/profile";
import {
  UUID_RE,
  getString,
  isEmail,
  isHttpUrl,
  normalizeUrl,
  type FormState,
} from "../../../lib/validation";

const PATH = "/cuenta/perfil-profesional";
const SHARED_TEXT = ["headline", "bio", "city", "phone", "website", "contact_email"] as const;

export async function saveProfessionalProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${PATH}`);
  if (getUserStatus(user) !== "active") {
    return { error: "Tu cuenta debe estar activa para editar tu perfil. Un administrador debe activarla." };
  }

  const role = getUserRole(user);
  if (!isProfileRole(role)) return { error: "Tu tipo de cuenta no tiene perfil profesional." };

  const roleKeys = ROLE_FIELDS[role];
  const socialKeys = SOCIAL_NETWORKS.map((n) => `social_${n.key}`);
  const values: Record<string, string | string[]> = {};
  for (const key of [...SHARED_TEXT, ...roleKeys, "skills", ...socialKeys]) {
    values[key] = getString(formData, key);
  }
  values.profile_public = formData.get("profile_public") === "on" ? "on" : "";

  const text = (key: string) => (typeof values[key] === "string" ? (values[key] as string) : "");
  const errors: Record<string, string> = {};

  for (const key of Object.keys(values)) {
    const limit = PROFILE_LIMITS[key as keyof typeof PROFILE_LIMITS];
    if (limit && text(key).length > limit) errors[key] = `Máximo ${limit} caracteres.`;
  }

  const email = text("contact_email");
  if (email && (!isEmail(email) || email.length > PROFILE_LIMITS.contact_email)) {
    errors.contact_email = "Escribe un correo válido.";
  }

  const website = normalizeUrl(text("website"));
  if (website && (!isHttpUrl(website) || website.length > PROFILE_LIMITS.website)) {
    errors.website = "Escribe un enlace válido que empiece por https://.";
  }

  const skills = parseSkills(text("skills"));
  if (skills.error) errors.skills = skills.error;

  const links: SocialLinks = {};
  for (const network of SOCIAL_NETWORKS) {
    const raw = text(`social_${network.key}`);
    if (!raw) continue;
    const problem = socialUrlError(network.key, raw);
    if (problem) errors[`social_${network.key}`] = problem;
    else links[network.key] = normalizeUrl(raw);
  }

  let portfolio = "";
  if (roleKeys.includes("portfolio_url")) {
    portfolio = normalizeUrl(text("portfolio_url"));
    if (portfolio && (!isHttpUrl(portfolio) || portfolio.length > PROFILE_LIMITS.portfolio_url)) {
      errors.portfolio_url = "Escribe un enlace válido que empiece por https://.";
    }
  }

  const availability = text("availability");
  if (availability && !isAvailability(availability)) errors.availability = "Elige una opción de la lista.";

  const careerId = text("career_id");
  const sectorId = text("sector_id");
  const career = careerId
    ? UUID_RE.test(careerId)
      ? await prisma.careers.findFirst({ where: { id: careerId, is_active: true }, select: { id: true } })
      : null
    : null;
  if (careerId && !career) errors.career_id = "Elige una carrera de la lista.";

  const sector = sectorId
    ? UUID_RE.test(sectorId)
      ? await prisma.sectors.findFirst({ where: { id: sectorId, is_active: true }, select: { id: true } })
      : null
    : null;
  if (sectorId && !sector) errors.sector_id = "Elige un sector de la lista.";

  if (Object.keys(errors).length > 0) {
    return { error: "Revisa los campos marcados.", fieldErrors: errors, values };
  }

  const shared = {
    headline: text("headline") || null,
    bio: text("bio") || null,
    skills: skills.skills,
    city: text("city") || null,
    phone: text("phone") || null,
    website: website || null,
    contact_email: email || null,
    social_links: Object.keys(links).length > 0 ? (links as Prisma.InputJsonObject) : Prisma.DbNull,
    profile_public: values.profile_public === "on",
  };

  const { first, last } = splitName(user.name);
  const name = user.name.trim() || "Sin nombre";
  const address = text("address") || null;
  const availabilityValue = isAvailability(availability) ? (availability as student_availability) : null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.users.update({ where: { id: user.id }, data: shared });

      if (role === "student") {
        const data = {
          first_name: first,
          last_name: last,
          career_id: career?.id ?? null,
          semester: text("semester") || null,
          availability: availabilityValue,
          portfolio_url: portfolio || null,
        };
        await tx.students.upsert({ where: { user_id: user.id }, create: { user_id: user.id, ...data }, update: data });
      } else if (role === "teacher") {
        const data = {
          first_name: first,
          last_name: last,
          title: text("title") || null,
          department: text("department") || null,
          research_group_name: text("research_group_name") || null,
        };
        await tx.teachers.upsert({ where: { user_id: user.id }, create: { user_id: user.id, ...data }, update: data });
      } else if (role === "company") {
        const data = { trade_name: name, sector_id: sector?.id ?? null, address };
        await tx.companies.upsert({ where: { user_id: user.id }, create: { user_id: user.id, ...data }, update: data });
      } else if (role === "association") {
        const data = {
          name,
          sector_id: sector?.id ?? null,
          address,
          core_activity: text("core_activity") || null,
        };
        await tx.associations.upsert({ where: { user_id: user.id }, create: { user_id: user.id, ...data }, update: data });
      } else if (role === "entrepreneur") {
        const data = { first_name: first, last_name: last, project_name: text("project_name") || null };
        await tx.entrepreneurs.upsert({ where: { user_id: user.id }, create: { user_id: user.id, ...data }, update: data });
      }
    });
  } catch {
    return { error: "No se pudo guardar tu perfil. Intenta de nuevo.", values };
  }

  redirect(`${PATH}?guardado=1`);
}

export async function removeProfilePhoto(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${PATH}`);

  const current = await prisma.users.findUnique({ where: { id: user.id }, select: { image: true } });
  await prisma.users.update({ where: { id: user.id }, data: { image: null } });

  const key = current?.image ? avatarKeyFromUrl(current.image) : null;
  if (key) await deleteMedia(key).catch(() => undefined);

  redirect(`${PATH}?foto=quitada`);
}
