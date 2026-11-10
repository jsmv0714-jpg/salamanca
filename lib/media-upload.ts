import { prisma } from "./prisma";
import { MEDIA_LIMITS } from "./media";
import { getUserRole, getUserStatus } from "./permissions";
import { UUID_RE } from "./validation";

export type UploadAuthorization =
  | { ok: true; publicationId: string; current: number }
  | { ok: false; status: number; error: string };

/**
 * Comprueba sesión, cuenta activa, propiedad de la publicación y cupo de
 * archivos. Compartido por la subida multipart y la subida directa.
 */
export async function authorizeMediaUpload(
  user: object | null | undefined,
  publicationId: string
): Promise<UploadAuthorization> {
  if (!user) return { ok: false, status: 401, error: "Debes iniciar sesión." };
  if (!UUID_RE.test(publicationId)) return { ok: false, status: 404, error: "No encontrado." };
  if (getUserStatus(user) !== "active") {
    return { ok: false, status: 403, error: "Tu cuenta debe estar activa para subir archivos." };
  }

  const publication = await prisma.publications.findUnique({
    where: { id: publicationId },
    select: { id: true, user_id: true, _count: { select: { publication_media: true } } },
  });
  const userId = (user as { id?: string }).id;
  if (!publication || (publication.user_id !== userId && getUserRole(user) !== "admin")) {
    return { ok: false, status: 404, error: "No encontrado." };
  }

  const current = publication._count.publication_media;
  if (current >= MEDIA_LIMITS.maxPerPublication) {
    return {
      ok: false,
      status: 400,
      error: `Una publicación admite hasta ${MEDIA_LIMITS.maxPerPublication} archivos.`,
    };
  }

  return { ok: true, publicationId: publication.id, current };
}
