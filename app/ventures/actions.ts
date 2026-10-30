"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/session";
import { getUserRole } from "../../lib/permissions";
import { slugify } from "../../lib/slug";
import {
  UUID_RE,
  getString,
  getStringList,
  isEmail,
  isHttpUrl,
  normalizeUrl,
  type FormState,
} from "../../lib/validation";
import {
  allowedVentureTypes,
  isBusinessModel,
  isVentureType,
  type BusinessModel,
  type VentureStatus,
  type VentureType,
} from "../../lib/ventures";

const TEXT_FIELDS = [
  "type",
  "name",
  "tagline",
  "description",
  "sector_id",
  "business_model",
  "trl_level",
  "service_stage",
  "research_group",
  "senior_consultant",
  "city",
  "logo_url",
  "website",
  "linkedin_url",
  "contact_email",
] as const;

type VentureInput = {
  type: VentureType;
  name: string;
  tagline: string | null;
  description: string;
  sector_id: string | null;
  business_model: BusinessModel;
  trl_level: number;
  service_stage: number | null;
  research_group: string | null;
  senior_consultant: string | null;
  city: string | null;
  logo_url: string | null;
  website: string | null;
  linkedin_url: string | null;
  contact_email: string | null;
  area_ids: string[];
};

type Parsed = { ok: true; data: VentureInput } | { ok: false; state: FormState };

async function parseVentureForm(formData: FormData, allowedTypes: VentureType[]): Promise<Parsed> {
  const values: Record<string, string | string[]> = {};
  for (const key of TEXT_FIELDS) values[key] = getString(formData, key);
  values.area_ids = getStringList(formData, "area_ids");

  const text = (key: (typeof TEXT_FIELDS)[number]) => values[key] as string;
  const errors: Record<string, string> = {};

  const type = text("type");
  if (!isVentureType(type) || !allowedTypes.includes(type)) {
    errors.type = "Tu tipo de cuenta no puede crear este tipo de venture.";
  }

  const name = text("name");
  if (name.length < 3 || name.length > 150) errors.name = "Escribe un nombre de 3 a 150 caracteres.";

  const tagline = text("tagline");
  if (tagline.length > 200) errors.tagline = "La frase corta no puede pasar de 200 caracteres.";

  const description = text("description");
  if (description.length < 30 || description.length > 5000) {
    errors.description = "La descripción debe tener entre 30 y 5000 caracteres.";
  }

  const businessModel = text("business_model");
  if (!isBusinessModel(businessModel)) errors.business_model = "Elige un modelo de negocio.";

  const trl = Number(text("trl_level"));
  if (!Number.isInteger(trl) || trl < 1 || trl > 9) errors.trl_level = "El TRL debe estar entre 1 y 9.";

  let stage: number | null = null;
  if (text("service_stage")) {
    const n = Number(text("service_stage"));
    if (!Number.isInteger(n) || n < 1 || n > 6) errors.service_stage = "Elige una etapa válida.";
    else stage = n;
  }

  const isSpinOff = type === "spin_off";
  const researchGroup = isSpinOff ? text("research_group") : "";
  const seniorConsultant = isSpinOff ? text("senior_consultant") : "";
  if (isSpinOff && !researchGroup) errors.research_group = "Indica el grupo de investigación de origen.";
  if (researchGroup.length > 150) errors.research_group = "Máximo 150 caracteres.";
  if (seniorConsultant.length > 150) errors.senior_consultant = "Máximo 150 caracteres.";

  const city = text("city");
  if (city.length > 100) errors.city = "Máximo 100 caracteres.";

  const urls: Record<"website" | "linkedin_url" | "logo_url", string> = {
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
    return {
      ok: false,
      state: { error: "Revisa los campos marcados.", fieldErrors: errors, values },
    };
  }

  return {
    ok: true,
    data: {
      type: type as VentureType,
      name,
      tagline: tagline || null,
      description,
      sector_id: sectorId,
      business_model: businessModel as BusinessModel,
      trl_level: trl,
      service_stage: stage,
      research_group: researchGroup || null,
      senior_consultant: seniorConsultant || null,
      city: city || null,
      logo_url: urls.logo_url || null,
      website: urls.website || null,
      linkedin_url: urls.linkedin_url || null,
      contact_email: email || null,
      area_ids: areas.map((a) => a.id),
    },
  };
}

async function uniqueSlug(name: string): Promise<string> {
  const root = slugify(name);
  for (let i = 1; i <= 20; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const taken = await prisma.ventures.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

export async function createVenture(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/ventures/nueva");

  const role = getUserRole(user);
  const parsed = await parseVentureForm(formData, allowedVentureTypes(role));
  if (!parsed.ok) return parsed.state;

  const { area_ids, ...data } = parsed.data;
  const status: VentureStatus = getString(formData, "intent") === "review" ? "in_review" : "draft";

  let slug = await uniqueSlug(data.name);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.ventures.create({
        data: {
          ...data,
          slug,
          user_id: user.id,
          status,
          venture_areas: { create: area_ids.map((area_id) => ({ area_id })) },
        },
      });
      break;
    } catch (error) {
      if (isUniqueViolation(error) && attempt < 2) {
        slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 7)}`;
        continue;
      }
      return { error: "No se pudo guardar la venture. Intenta de nuevo." };
    }
  }

  redirect(`/ventures/${slug}`);
}

export async function updateVenture(
  slug: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/ventures/${slug}/editar`)}`);

  const venture = await prisma.ventures.findUnique({ where: { slug } });
  const role = getUserRole(user);
  const isOwner = venture?.user_id === user.id;
  if (!venture || (!isOwner && role !== "admin")) {
    return { error: "No tienes permiso para editar esta venture." };
  }

  const allowedTypes = Array.from(new Set<VentureType>([...allowedVentureTypes(role), venture.type]));
  const parsed = await parseVentureForm(formData, allowedTypes);
  if (!parsed.ok) return parsed.state;

  const { area_ids, ...data } = parsed.data;

  // La dueña o el dueño nunca se salta la revisión: si la venture estaba publicada,
  // cualquier cambio la devuelve a "en revisión". Un administrador que edita la de otra
  // persona no cambia su estado.
  let status: VentureStatus = venture.status;
  if (isOwner) {
    if (venture.status === "published") status = "in_review";
    else status = getString(formData, "intent") === "review" ? "in_review" : "draft";
  }

  try {
    await prisma.ventures.update({
      where: { id: venture.id },
      data: {
        ...data,
        status,
        rejection_reason: status === "rejected" ? venture.rejection_reason : null,
        venture_areas: {
          deleteMany: {},
          create: area_ids.map((area_id) => ({ area_id })),
        },
      },
    });
  } catch {
    return { error: "No se pudieron guardar los cambios. Intenta de nuevo." };
  }

  redirect(`/ventures/${slug}`);
}

export async function deleteVenture(slug: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/ventures/${slug}`)}`);

  const venture = await prisma.ventures.findUnique({
    where: { slug },
    select: { id: true, user_id: true },
  });
  const isAdmin = getUserRole(user) === "admin";
  if (!venture || (venture.user_id !== user.id && !isAdmin)) {
    redirect("/ventures");
  }

  await prisma.ventures.delete({ where: { id: venture.id } });
  redirect(isAdmin && venture.user_id !== user.id ? "/admin/ventures" : "/cuenta");
}
