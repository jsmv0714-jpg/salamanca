import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../../lib/session";
import { getUserRole } from "../../../../../../lib/permissions";
import { UUID_RE } from "../../../../../../lib/validation";
import { deleteMedia, thumbKeyFor } from "../../../../../../lib/storage";

/** Quita un archivo de una publicación y lo borra del almacenamiento (con su miniatura). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; mediaId: string }> }) {
  const { id, mediaId } = await params;

  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });
  if (!UUID_RE.test(id) || !UUID_RE.test(mediaId)) return Response.json({ error: "No encontrado." }, { status: 404 });

  const media = await prisma.publication_media.findFirst({
    where: { id: mediaId, publication_id: id },
    select: { id: true, storage_key: true, thumb_key: true, publications: { select: { user_id: true } } },
  });
  if (!media || (media.publications.user_id !== user.id && getUserRole(user) !== "admin")) {
    return Response.json({ error: "No encontrado." }, { status: 404 });
  }

  await prisma.publication_media.delete({ where: { id: media.id } });

  // Las miniaturas antiguas pueden existir sin columna `thumb_key`; se intenta
  // borrar la clave derivada por si acaso.
  const thumbKey = media.thumb_key ?? thumbKeyFor(media.storage_key);
  await Promise.all(
    [media.storage_key, thumbKey].map((key) =>
      deleteMedia(key).catch((error) => {
        console.error("No se pudo borrar el archivo del almacenamiento:", error);
      })
    )
  );

  return new Response(null, { status: 204 });
}
