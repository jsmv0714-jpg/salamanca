// Fase 2: crea las áreas priorizadas del modelo Winner si todavía no existen.
// Uso (desde la raíz del proyecto):  node --env-file=.env scripts/fase2-seed.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AREAS = [
  ["Mercadeo y ventas", "mercadeo-y-ventas"],
  ["Finanzas", "finanzas"],
  ["Producción y logística", "produccion-y-logistica"],
  ["Recursos humanos", "recursos-humanos"],
  ["Tecnología", "tecnologia"],
  ["Innovación y estrategia de negocios", "innovacion-y-estrategia-de-negocios"],
  ["Jurídica", "juridica"],
];

try {
  const existentes = await prisma.areas_of_expertise.findMany({
    select: { name: true, slug: true },
  });
  const slugs = new Set(existentes.map((a) => a.slug));
  const nombres = new Set(existentes.map((a) => a.name.toLowerCase()));

  let creadas = 0;
  for (const [name, slug] of AREAS) {
    if (slugs.has(slug) || nombres.has(name.toLowerCase())) continue;
    await prisma.areas_of_expertise.create({ data: { name, slug } });
    creadas++;
    console.log(`Área creada: ${name}`);
  }
  console.log(
    creadas === 0
      ? "Las áreas ya existían. No se creó nada."
      : `Listo: ${creadas} área(s) creada(s).`
  );
} finally {
  await prisma.$disconnect();
}
