import { cacheLife } from "next/cache";
import { prisma } from "./prisma";

/**
 * Catálogos usados por los filtros. Cambian muy poco, así que se reutilizan
 * entre peticiones en el mismo proceso (`use cache`) y se refrescan cada hora.
 */

export async function activeSectors() {
  "use cache";
  cacheLife("hours");
  return prisma.sectors.findMany({ where: { is_active: true }, orderBy: { name: "asc" } });
}

export async function activeCareers() {
  "use cache";
  cacheLife("hours");
  return prisma.careers.findMany({ where: { is_active: true }, orderBy: { name: "asc" } });
}

export async function activePublicationTypes() {
  "use cache";
  cacheLife("hours");
  return prisma.publication_types.findMany({ where: { is_active: true }, orderBy: { name: "asc" } });
}

export async function activeAreas() {
  "use cache";
  cacheLife("hours");
  return prisma.areas_of_expertise.findMany({ where: { is_active: true }, orderBy: { name: "asc" } });
}
