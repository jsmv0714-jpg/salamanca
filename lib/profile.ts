import { isHttpUrl, normalizeUrl } from "./validation";

/**
 * Perfil profesional de cada cuenta. Los datos generales viven en `users` (iguales para
 * todos los roles); los propios de cada rol viven en su tabla (students, companies...).
 * Este archivo no usa Node ni Prisma para que lo puedan importar también los formularios.
 */

export const PROFILE_ROLES = ["student", "teacher", "company", "association", "entrepreneur", "admin"] as const;
export type ProfileRole = (typeof PROFILE_ROLES)[number];

export const SOCIAL_NETWORKS = [
  { key: "linkedin", label: "LinkedIn", hosts: ["linkedin.com"] },
  { key: "instagram", label: "Instagram", hosts: ["instagram.com"] },
  { key: "facebook", label: "Facebook", hosts: ["facebook.com", "fb.com"] },
  { key: "x", label: "X (Twitter)", hosts: ["x.com", "twitter.com"] },
] as const;

export type SocialKey = (typeof SOCIAL_NETWORKS)[number]["key"];
export type SocialLinks = Partial<Record<SocialKey, string>>;

export const SKILL_MAX_COUNT = 15;
export const SKILL_MAX_LENGTH = 40;

/** Límites de los campos de texto. Son los mismos en el servidor y en el formulario. */
export const PROFILE_LIMITS = {
  headline: 160,
  bio: 2000,
  city: 100,
  phone: 50,
  website: 500,
  contact_email: 150,
  semester: 20,
  portfolio_url: 500,
  title: 150,
  department: 150,
  research_group_name: 150,
  address: 255,
  core_activity: 2000,
  project_name: 200,
} as const;

/** Campos que dependen del rol y se guardan en su tabla propia. */
export const ROLE_FIELDS: Record<ProfileRole, readonly string[]> = {
  student: ["career_id", "semester", "availability", "portfolio_url"],
  teacher: ["title", "department", "research_group_name"],
  company: ["sector_id", "address"],
  association: ["sector_id", "address", "core_activity"],
  entrepreneur: ["project_name"],
  admin: [],
};

type RoleCopy = {
  intro: string;
  headline: { label: string; hint: string };
  bio: { label: string; hint: string };
  skills: { label: string; hint: string };
};

export const PROFILE_COPY: Record<ProfileRole, RoleCopy> = {
  student: {
    intro: "Así te verán las empresas y otros miembros cuando decidas mostrar tu perfil.",
    headline: { label: "Titular", hint: "Ej.: Estudiante de Ingeniería de Sistemas · Desarrollo web" },
    bio: { label: "Perfil profesional", hint: "Cuéntanos tu formación, tus intereses y qué buscas." },
    skills: { label: "Habilidades", hint: "Separa cada habilidad con una coma. Ej.: Excel, Python, redacción." },
  },
  teacher: {
    intro: "Presenta tu experiencia para que otros miembros del ecosistema te encuentren.",
    headline: { label: "Titular", hint: "Ej.: Consultor en innovación y transferencia tecnológica" },
    bio: { label: "Perfil profesional", hint: "Tu trayectoria, grupos de investigación y experiencia asesorando." },
    skills: { label: "Áreas de experiencia", hint: "Separa cada área con una coma." },
  },
  company: {
    intro: "Muestra a qué se dedica tu empresa y qué servicios o capacidades ofrece.",
    headline: { label: "Frase de presentación", hint: "Una línea que resuma lo que hace tu empresa." },
    bio: { label: "Descripción de la empresa", hint: "Qué hace, a quién le sirve y qué la diferencia." },
    skills: { label: "Servicios y capacidades", hint: "Separa cada servicio con una coma." },
  },
  association: {
    intro: "Muestra la misión de tu agremiación y los servicios que presta a sus afiliados.",
    headline: { label: "Frase de presentación", hint: "Una línea que resuma la misión de la agremiación." },
    bio: { label: "Descripción de la agremiación", hint: "Su misión, afiliados y alcance." },
    skills: { label: "Servicios que ofrece", hint: "Separa cada servicio con una coma." },
  },
  entrepreneur: {
    intro: "Cuenta qué construyes y qué habilidades aportas a tu proyecto.",
    headline: { label: "Frase de presentación", hint: "Qué estás construyendo, en una línea." },
    bio: { label: "Descripción de tu proyecto", hint: "El problema que resuelves, en qué etapa estás y qué buscas." },
    skills: { label: "Habilidades", hint: "Separa cada habilidad con una coma." },
  },
  admin: {
    intro: "Datos visibles de tu cuenta de administración.",
    headline: { label: "Titular", hint: "Una línea sobre tu cargo." },
    bio: { label: "Descripción", hint: "Información breve sobre tu función." },
    skills: { label: "Habilidades", hint: "Separa cada habilidad con una coma." },
  },
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  full_time: "Tiempo completo",
  part_time: "Medio tiempo",
  flexible: "Flexible",
};

export function isProfileRole(value: unknown): value is ProfileRole {
  return typeof value === "string" && (PROFILE_ROLES as readonly string[]).includes(value);
}

export function copyFor(role: string): RoleCopy {
  return isProfileRole(role) ? PROFILE_COPY[role] : PROFILE_COPY.admin;
}

/**
 * Convierte "Excel, python,  excel" en ["Excel", "python"]: quita vacíos y repetidos
 * sin importar mayúsculas. Devuelve un error en español si se pasa del límite.
 */
export function parseSkills(raw: string): { skills: string[]; error?: string } {
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const part of raw.split(",")) {
    const skill = part.replace(/\s+/g, " ").trim();
    if (!skill) continue;
    if (skill.length > SKILL_MAX_LENGTH) {
      return { skills, error: `Cada habilidad puede tener hasta ${SKILL_MAX_LENGTH} caracteres.` };
    }
    const key = skill.toLocaleLowerCase("es");
    if (seen.has(key)) continue;
    seen.add(key);
    skills.push(skill);
  }
  if (skills.length > SKILL_MAX_COUNT) {
    return { skills, error: `Puedes registrar hasta ${SKILL_MAX_COUNT} habilidades.` };
  }
  return { skills };
}

/** Comprueba que el enlace sea http(s) y apunte a la red social indicada (o a un subdominio). */
export function socialUrlError(network: SocialKey, value: string): string | null {
  const config = SOCIAL_NETWORKS.find((n) => n.key === network);
  if (!config) return "Red social no reconocida.";
  const url = normalizeUrl(value);
  if (!isHttpUrl(url) || url.length > 500) return "Escribe un enlace válido que empiece por https://.";
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const matches = config.hosts.some((h) => host === h || host.endsWith(`.${h}`));
    return matches ? null : `El enlace debe ser de ${config.label}.`;
  } catch {
    return "Escribe un enlace válido que empiece por https://.";
  }
}

/** Lee lo guardado en `users.social_links` sin confiar en la forma del JSON. */
export function readSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const links: SocialLinks = {};
  for (const network of SOCIAL_NETWORKS) {
    const link = source[network.key];
    if (typeof link === "string" && link) links[network.key] = link;
  }
  return links;
}

/** Divide el nombre completo en nombre y apellidos para las tablas de cada rol. */
export function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function isAvailability(value: unknown): value is keyof typeof AVAILABILITY_LABELS {
  return typeof value === "string" && value in AVAILABILITY_LABELS;
}

/** Enlace listo para mostrar: añade https:// si falta, o null si no es válido. */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const url = normalizeUrl(value);
  return isHttpUrl(url) ? url : null;
}
