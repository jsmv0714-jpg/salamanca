import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/session";
import { getUserRole } from "../../../../../lib/permissions";
import { contentDisposition } from "../../../../../lib/cv-file";
import { UUID_RE } from "../../../../../lib/validation";

/**
 * Descarga la hoja de vida adjunta a una postulación.
 * Solo pueden verla: quien se postuló, quien publicó la oferta y los administradores.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) return new Response("Debes iniciar sesión.", { status: 401 });
  if (!UUID_RE.test(id)) return new Response("No encontrado.", { status: 404 });

  const application = await prisma.applications.findUnique({
    where: { id },
    select: {
      applicant_id: true,
      publications: { select: { user_id: true } },
      application_files: { select: { filename: true, mime_type: true, data: true } },
    },
  });

  const allowed =
    application &&
    (application.applicant_id === user.id ||
      application.publications.user_id === user.id ||
      getUserRole(user) === "admin");

  // Misma respuesta si no existe o no tiene permiso, para no revelar qué postulaciones existen.
  if (!application || !allowed || !application.application_files) {
    return new Response("No encontrado.", { status: 404 });
  }

  const file = application.application_files;
  // `Uint8Array` es un BodyInit válido; el Buffer de Prisma no encaja en los tipos de Next 16.
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Disposition": contentDisposition(file.filename),
      "Content-Length": String(file.data.length),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
