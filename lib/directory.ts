import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { fold } from "./query";
import {
  DIRECTORY_ROLES,
  isDirectoryRole,
  type BusinessModel,
  type DirectoryRole,
} from "./ventures";
import { readSocialLinks, type SocialLinks } from "./profile";
import { UUID_RE } from "./validation";

export type DirectoryEntry = {
  id: string;
  userId: string;
  role: DirectoryRole;
  name: string;
  subtitle: string | null;
  headline: string | null;
  coreExpertise: string | null;
  businessModel: BusinessModel | null;
  sector: string | null;
  city: string | null;
  website: string | null;
  linkedinUrl: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  allianceStatus: string | null;
  areas: { slug: string; name: string }[];
  skills: string[];
  socialLinks: SocialLinks;
  isVisible: boolean;
  /** Puerto de ficha pública: aunque esté activa, no tiene perfil en el directorio. */
  profilePublic: boolean;
};

/** Entrada del directorio para el panel de la derecha (usado por Mi cuenta y el listado). */
export type DirectoryDetailEntry = DirectoryEntry;

export type DirectoryFilters = {
  tipo?: DirectoryRole;
  sector?: string;
  area?: string;
  modelo?: BusinessModel;
  alianza?: "intention" | "active";
  q?: string;
};

/** Solo los campos que realmente usa una ficha del directorio. */
const profileSelect = {
  id: true,
  user_id: true,
  display_name: true,
  headline: true,
  core_expertise: true,
  business_model: true,
  city: true,
  website: true,
  linkedin_url: true,
  logo_url: true,
  contact_email: true,
  is_visible: true,
  sectors: { select: { name: true } },
  directory_profile_areas: {
    select: { areas_of_expertise: { select: { slug: true, name: true } } },
  },
  users: {
    select: {
      id: true,
      name: true,
      role: true,
      image: true,
      headline: true,
      skills: true,
      city: true,
      website: true,
      contact_email: true,
      social_links: true,
      profile_public: true,
      companies: {
        select: {
          trade_name: true,
          sectors: { select: { name: true } },
          city: true,
          website: true,
          logo_url: true,
          contact_email: true,
          linkedin_url: true,
          alliance_status: true,
        },
      },
      associations: {
        select: {
          name: true,
          core_activity: true,
          sectors: { select: { name: true } },
          city: true,
          website: true,
          logo_url: true,
          contact_email: true,
        },
      },
      entrepreneurs: {
        select: { first_name: true, last_name: true, project_name: true, website: true, linkedin_url: true },
      },
      teachers: {
        select: { first_name: true, last_name: true, title: true, research_group_name: true, linkedin_url: true },
      },
    },
  },
} satisfies Prisma.directory_profilesSelect;

type ProfileRow = Prisma.directory_profilesGetPayload<{ select: typeof profileSelect }>;

/**
 * Une el perfil de directorio con los datos del registro por rol.
 * Lo que la persona escribió en su perfil tiene prioridad; si falta, se usa lo del registro.
 */
function toEntry(row: ProfileRow): DirectoryEntry | null {
  const role = row.users.role;
  if (!isDirectoryRole(role)) return null;

  const { companies, associations, entrepreneurs, teachers } = row.users;

  let baseName = row.users.name;
  let subtitle: string | null = null;
  let baseSector: string | null = null;
  let baseCity: string | null = null;
  let baseWebsite: string | null = null;
  let baseLogo: string | null = null;
  let baseEmail: string | null = null;
  let baseLinkedin: string | null = null;
  let allianceStatus: string | null = null;

  if (role === "company" && companies) {
    baseName = companies.trade_name;
    baseSector = companies.sectors?.name ?? null;
    baseCity = companies.city;
    baseWebsite = companies.website;
    baseLogo = companies.logo_url;
    baseEmail = companies.contact_email;
    baseLinkedin = companies.linkedin_url;
    allianceStatus = companies.alliance_status === "none" ? null : companies.alliance_status;
  } else if (role === "association" && associations) {
    baseName = associations.name;
    subtitle = associations.core_activity;
    baseSector = associations.sectors?.name ?? null;
    baseCity = associations.city;
    baseWebsite = associations.website;
    baseLogo = associations.logo_url;
    baseEmail = associations.contact_email;
  } else if (role === "entrepreneur" && entrepreneurs) {
    baseName = `${entrepreneurs.first_name} ${entrepreneurs.last_name}`.trim();
    subtitle = entrepreneurs.project_name;
    baseWebsite = entrepreneurs.website;
    baseLinkedin = entrepreneurs.linkedin_url;
  } else if (role === "teacher" && teachers) {
    baseName = `${teachers.first_name} ${teachers.last_name}`.trim();
    subtitle = teachers.title ?? teachers.research_group_name;
    baseLinkedin = teachers.linkedin_url;
  }

  const account = row.users;
  const socialLinks = readSocialLinks(account.social_links);

  return {
    id: row.id,
    userId: row.user_id,
    role,
    name: row.display_name || baseName || "Sin nombre",
    subtitle,
    headline: row.headline ?? account.headline,
    coreExpertise: row.core_expertise,
    businessModel: row.business_model,
    sector: row.sectors?.name ?? baseSector,
    city: row.city ?? baseCity ?? account.city,
    website: row.website ?? baseWebsite ?? account.website,
    linkedinUrl: row.linkedin_url ?? baseLinkedin ?? socialLinks.linkedin ?? null,
    logoUrl: row.logo_url ?? baseLogo ?? account.image,
    contactEmail: row.contact_email ?? baseEmail ?? account.contact_email,
    allianceStatus,
    areas: row.directory_profile_areas
      .map((a) => ({ slug: a.areas_of_expertise.slug, name: a.areas_of_expertise.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es")),
    skills: account.skills,
    socialLinks,
    isVisible: row.is_visible,
    profilePublic: account.profile_public,
  };
}

/** Condición común: perfil visible y cuenta activa de un rol que puede salir en el directorio. */
function visibleWhere(role?: DirectoryRole): Prisma.directory_profilesWhereInput {
  return {
    is_visible: true,
    users: {
      status: "active",
      role: role ?? { in: [...DIRECTORY_ROLES] },
    },
  };
}

export async function loadDirectory(filters: DirectoryFilters): Promise<DirectoryEntry[]> {
  const and: Prisma.directory_profilesWhereInput[] = [visibleWhere(filters.tipo)];

  if (filters.sector) {
    const slug = filters.sector;
    and.push({
      OR: [
        { sectors: { slug } },
        {
          sector_id: null,
          OR: [
            { users: { companies: { is: { sectors: { slug } } } } },
            { users: { associations: { is: { sectors: { slug } } } } },
          ],
        },
      ],
    });
  }

  if (filters.area) {
    and.push({
      directory_profile_areas: { some: { areas_of_expertise: { slug: filters.area } } },
    });
  }

  if (filters.modelo) {
    and.push({
      business_model: filters.modelo === "both" ? "both" : { in: [filters.modelo, "both"] },
    });
  }

  if (filters.alianza) {
    and.push({ users: { companies: { is: { alliance_status: filters.alianza } } } });
  }

  const rows = await prisma.directory_profiles.findMany({
    where: { AND: and },
    select: profileSelect,
    take: 300,
  });

  let entries = rows.map(toEntry).filter((e): e is DirectoryEntry => e !== null);

  if (filters.q) {
    const needle = fold(filters.q);
    entries = entries.filter((e) =>
      fold(
        [e.name, e.subtitle, e.headline, e.coreExpertise, e.city, e.sector, ...e.skills, ...e.areas.map((a) => a.name)]
          .filter(Boolean)
          .join(" ")
      ).includes(needle)
    );
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function loadDirectoryEntry(id: string): Promise<DirectoryEntry | null> {
  if (!UUID_RE.test(id)) return null;
  const row = await prisma.directory_profiles.findFirst({
    where: { AND: [{ id }, visibleWhere()] },
    select: profileSelect,
  });
  return row ? toEntry(row) : null;
}
