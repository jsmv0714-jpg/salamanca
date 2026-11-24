import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

/**
 * Datos de prueba de las pruebas E2E. Todos los correos empiezan por `e2e.`
 * y la limpieza final los borra junto con la publicación de ejemplo.
 */

export const E2E_PREFIX = "e2e.";
export const E2E_PASSWORD = "ClaveE2E123!";
export const E2E_PUBLICATION_SLUG = "e2e-practica-smoke";
export const E2E_DIRECTORY_PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const E2E_AREA_SLUG = "e2e-desarrollo-web";

export const E2E_STUDENT = {
  email: "e2e.estudiante@unisalamanca.test",
  name: "Estudiante E2E",
  password: E2E_PASSWORD,
};

export const E2E_ADMIN = {
  email: "e2e.admin@unisalamanca.test",
  name: "Admin E2E",
  password: E2E_PASSWORD,
};

export const E2E_COMPANY = {
  email: "e2e.empresa@unisalamanca.test",
  name: "Empresa E2E",
  password: E2E_PASSWORD,
};

const prisma = new PrismaClient();

type FixtureUser = { email: string; name: string; password: string; role: "student" | "admin" | "company" };

async function createUser(user: FixtureUser) {
  const created = await prisma.users.create({
    data: {
      email: user.email,
      name: user.name,
      role: user.role,
      status: "active",
      email_verified: true,
      email_verified_at: new Date(),
    },
    select: { id: true },
  });

  await prisma.account.create({
    data: {
      accountId: created.id,
      providerId: "credential",
      userId: created.id,
      password: await hashPassword(user.password),
    },
  });

  return created.id;
}

/** Borra los datos de ejecuciones anteriores. */
export async function resetFixtures() {
  await prisma.publications.deleteMany({ where: { slug: E2E_PUBLICATION_SLUG } });
  await prisma.users.deleteMany({ where: { email: { startsWith: E2E_PREFIX } } });
  await prisma.areas_of_expertise.deleteMany({ where: { slug: E2E_AREA_SLUG } });
}

/** Crea las cuentas y la publicación publicada que usan las pruebas. */
export async function seedFixtures() {
  await resetFixtures();
  // Cada corrida inicia sesión muchas veces desde la misma IP: se reinician los contadores
  // del límite de intentos para que una corrida no bloquee a la siguiente.
  await prisma.rateLimit.deleteMany({});

  await createUser({ ...E2E_STUDENT, role: "student" });
  await createUser({ ...E2E_ADMIN, role: "admin" });
  const companyId = await createUser({ ...E2E_COMPANY, role: "company" });

  // En una base recién migrada no hay tipos de publicación: se crea el de prácticas.
  const type = await prisma.publication_types.upsert({
    where: { code: "internship" },
    update: {},
    create: { code: "internship", name: "Práctica profesional" },
    select: { id: true },
  });

  await prisma.publications.create({
    data: {
      user_id: companyId,
      author_type: "company",
      publication_type_id: type.id,
      title: "Práctica E2E de prueba",
      slug: E2E_PUBLICATION_SLUG,
      description:
        "Publicación creada automáticamente por las pruebas E2E. Apoyo en desarrollo web y análisis de datos.",
      requirements: "Estudiante de últimos semestres con disponibilidad de medio tiempo.",
      benefits: "Acompañamiento, certificado y posibilidad de continuar como junior.",
      location: "Bogotá",
      modality: "hybrid",
      contact_email: E2E_COMPANY.email,
      show_contact: false,
      status: "published",
      published_at: new Date(),
    },
  });

  // Ficha visible del directorio para probar guardados, ocultos y denuncias de miembros.
  const area = await prisma.areas_of_expertise.upsert({
    where: { slug: E2E_AREA_SLUG },
    update: {},
    create: { name: "Desarrollo web E2E", slug: E2E_AREA_SLUG },
    select: { id: true },
  });
  await prisma.directory_profiles.create({
    data: {
      id: E2E_DIRECTORY_PROFILE_ID,
      user_id: companyId,
      display_name: "Empresa E2E",
      headline: "Asesoría en desarrollo web",
      core_expertise: "Desarrollo web y análisis de datos",
      is_visible: true,
      directory_profile_areas: { create: { area_id: area.id } },
    },
  });

  // El setup termina aquí: no se necesita la conexión durante las pruebas.
  await prisma.$disconnect();
}

/** Limpia todo lo creado por las pruebas. */
export async function cleanupFixtures() {
  await resetFixtures();
  await prisma.$disconnect();
}
