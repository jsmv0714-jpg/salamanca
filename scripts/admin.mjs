/**
 * Promueve o retira el rol de administrador por consola.
 *
 *   npm run admin:promote -- persona@correo.com
 *   npm run admin:demote  -- persona@correo.com
 *
 * Sirve para crear el primer administrador (el panel exige que ya exista uno)
 * y para emergencias en las que no se puede entrar al panel.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const [command, email] = process.argv.slice(2);

const USAGE = [
  "Uso:",
  "  npm run admin:promote -- persona@correo.com",
  "  npm run admin:demote  -- persona@correo.com",
].join("\n");

async function roleBeforeAdmin(userId) {
  const previous = await prisma.role_changes.findFirst({
    where: { user_id: userId, to_role: "admin" },
    orderBy: { created_at: "desc" },
    select: { from_role: true },
  });
  return previous && previous.from_role !== "admin" ? previous.from_role : "student";
}

async function main() {
  if (!command || !["promote", "demote"].includes(command) || !email) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  const user = await prisma.users.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!user) {
    console.error(`No existe ninguna cuenta con el correo ${email}.`);
    process.exitCode = 1;
    return;
  }

  if (command === "promote") {
    if (user.role === "admin") {
      console.error(`${user.email} ya es administrador.`);
      process.exitCode = 1;
      return;
    }

    await prisma.$transaction([
      prisma.users.update({ where: { id: user.id }, data: { role: "admin" } }),
      prisma.role_changes.create({
        data: { user_id: user.id, from_role: user.role, to_role: "admin" },
      }),
    ]);

    console.log(`${user.name || user.email} (${user.email}) ahora es administrador.`);
    if (user.status !== "active") {
      console.warn(
        `Aviso: su cuenta está en estado "${user.status}". Actívala en /admin/usuarios para que pueda iniciar sesión.`
      );
    }
    return;
  }

  if (user.role !== "admin") {
    console.error(`${user.email} no es administrador.`);
    process.exitCode = 1;
    return;
  }

  const admins = await prisma.users.count({ where: { role: "admin" } });
  if (admins <= 1) {
    console.error("Debe quedar al menos un administrador. Promueve a otra persona antes de quitar este rol.");
    process.exitCode = 1;
    return;
  }

  const restored = await roleBeforeAdmin(user.id);
  await prisma.$transaction([
    prisma.users.update({ where: { id: user.id }, data: { role: restored } }),
    prisma.role_changes.create({
      data: { user_id: user.id, from_role: "admin", to_role: restored },
    }),
  ]);

  console.log(`Se retiró el rol de administrador a ${user.name || user.email} (${user.email}). Ahora es ${restored}.`);
}

main()
  .catch((error) => {
    console.error("No se pudo completar el cambio:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
