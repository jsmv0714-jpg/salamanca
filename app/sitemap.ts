import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { prisma } from "../lib/prisma";
import { appUrl } from "../lib/email";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = appUrl();

  // Solo las publicaciones ya aprobadas: borradores y rechazadas no deben indexarse.
  const publications = await prisma.publications.findMany({
    where: { status: "published" },
    select: { slug: true, updated_at: true },
  });

  const news = await prisma.news.findMany({
    where: { status: "published", published_at: { lte: new Date() } },
    select: { slug: true, updated_at: true },
  });

  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/noticias`, changeFrequency: "daily", priority: 0.9 },
    ...news.map((item) => ({
      url: `${base}/noticias/${item.slug}`,
      lastModified: item.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${base}/publicaciones`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/directorio`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/ventures`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    ...publications.map((publication) => ({
      url: `${base}/publicaciones/${publication.slug}`,
      lastModified: publication.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
