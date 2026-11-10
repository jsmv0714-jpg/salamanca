"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { getUserRole } from "../../../lib/permissions";
import { isUserStatus } from "../../../lib/admin";
import { UUID_RE, getString } from "../../../lib/validation";
import { appUrl, sendEmail } from "../../../lib/email";
import { demoteAdmin, promoteToAdmin } from "../../../lib/admin-roles";

/** Correo avisando del cambio de estado de la cuenta. */
async function notifyStatusChange(email: string, name: string | null, status: "active" | "suspended") {
  const greeting = `Hola${name ? ` ${name}` : ""},`;
  const text =
    status === "active"
      ? [
          greeting,
          "",
          "Tu cuenta en Unisalamanca Marketplace fue activada. Ya puedes iniciar sesión y usar la plataforma.",
          "",
          `${appUrl()}/login`,
        ].join("\n")
      : [
          greeting,
          "",
          "Tu cuenta en Unisalamanca Marketplace fue suspendida y no podrá publicar ni postularse.",
          "Si crees que es un error, responde a este correo para revisarlo.",
        ].join("\n");

  await sendEmail({
    to: email,
    subject:
      status === "active"
        ? "Tu cuenta fue activada | Unisalamanca Marketplace"
        : "Tu cuenta fue suspendida | Unisalamanca Marketplace",
    text,
  });
}

/** Activa, suspende o deja pendiente una cuenta. No permite tocar la propia ni las de otros administradores. */export async function setUserStatus(formData: FormData): Promise<void> {
  const admin = await getCurrentUser();
  if (!admin || getUserRole(admin) !== "admin") throw new Error("No autorizado");

  const id = getString(formData, "id");
  const status = getString(formData, "status");
  const back = getString(formData, "back");
  const returnTo = back.startsWith("/admin/usuarios") ? back : "/admin/usuarios";

  if (UUID_RE.test(id) && isUserStatus(status) && id !== admin.id) {
    const target = await prisma.users.findFirst({
      where: { id, role: { not: "admin" } },
      select: { email: true, name: true, status: true },
    });

    if (target) {
      const result = await prisma.users.updateMany({
        where: { id, role: { not: "admin" } },
        data: { status },
      });

      // Solo se avisa cuando el estado cambió de verdad y es un estado accionable.
      if (result.count > 0 && target.status !== status && (status === "active" || status === "suspended")) {
        await notifyStatusChange(target.email, target.name, status).catch((error) => {
          console.error("No se pudo enviar el correo de estado de cuenta:", error);
        });
      }
    }
  }
  redirect(returnTo);
}

/** Agrega el resultado a la URL de vuelta sin perder los filtros. */
function withResult(back: string, value: string): string {
  const [path, query = ""] = back.split("?");
  const params = new URLSearchParams(query);
  params.set("ajuste", value);
  return `${path}?${params.toString()}`;
}

/** Correo avisando de que la persona pasa a ser administradora o deja de serlo. */
async function notifyRoleChange(name: string | null, email: string, granted: boolean) {
  const greeting = `Hola${name ? ` ${name}` : ""},`;

  await sendEmail({
    to: email,
    subject: granted
      ? "Ahora eres administrador | Unisalamanca Marketplace"
      : "Tu rol de administrador fue retirado | Unisalamanca Marketplace",
    text: granted
      ? [
          greeting,
          "",
          "Ahora tienes permisos de administrador en Unisalamanca Marketplace: puedes aprobar publicaciones y gestionar cuentas.",
          "",
          `${appUrl()}/admin`,
        ].join("\n")
      : [
          greeting,
          "",
          "Tu rol de administrador en Unisalamanca Marketplace fue retirado. Tu cuenta sigue activa con el rol que tenías antes.",
          "",
          `${appUrl()}`,
        ].join("\n"),
  });
}

/** Promueve a administrador o retira ese rol. Solo lo puede hacer otro administrador. */
export async function setUserRole(formData: FormData): Promise<void> {
  const admin = await getCurrentUser();
  if (!admin || getUserRole(admin) !== "admin") throw new Error("No autorizado");

  const id = getString(formData, "id");
  const role = getString(formData, "role");
  const backParam = getString(formData, "back");
  const back = backParam.startsWith("/admin/usuarios") ? backParam : "/admin/usuarios";

  if (!UUID_RE.test(id)) redirect(withResult(back, "not_found"));

  const result =
    role === "promote" ? await promoteToAdmin(id, admin.id) : await demoteAdmin(id, admin.id);

  if (!result.ok) redirect(withResult(back, result.code));

  await notifyRoleChange(result.name, result.email, role === "promote").catch((error) => {
    console.error("No se pudo enviar el correo de cambio de rol:", error);
  });

  redirect(withResult(back, role === "promote" ? "promoted" : "demoted"));
}
