import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";
import { isSameOrigin } from "../../../../lib/origin";
import { getUserStatus } from "../../../../lib/permissions";
import { MEDIA_LIMITS, detectMedia } from "../../../../lib/media";
import { processAvatar } from "../../../../lib/media-processing";
import { avatarKey, avatarKeyFromUrl } from "../../../../lib/avatar";
import { deleteMedia, mediaPublicUrl, putMedia } from "../../../../lib/storage";

function fail(error: string, status: number) {
  return Response.json({ error }, { status });
}

/** Sube la foto de perfil de la persona que inicia sesión. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Petición no permitida.", 403);
  const user = await getCurrentUser();
  if (!user) return fail("Debes iniciar sesión.", 401);
  if (getUserStatus(user) !== "active") return fail("Tu cuenta debe estar activa para cambiar tu foto.", 403);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("No pudimos leer el archivo. Intenta de nuevo.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return fail("Selecciona una imagen.", 400);
  if (file.size === 0) return fail("El archivo está vacío.", 400);
  if (file.size > MEDIA_LIMITS.imageBytes) return fail("La foto puede pesar hasta 5 MB.", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectMedia(bytes);
  if (!detected || detected.kind !== "image") {
    return fail("Solo se aceptan imágenes JPG, PNG o WebP.", 415);
  }

  let processed: Uint8Array;
  try {
    processed = await processAvatar(bytes);
  } catch {
    return fail("No pudimos procesar la imagen. Prueba con otra.", 422);
  }

  const key = avatarKey(user.id);
  try {
    await putMedia(key, processed, "image/webp");
  } catch {
    return fail("No se pudo guardar la foto en este momento. Intenta más tarde.", 503);
  }

  const previous = await prisma.users.findUnique({ where: { id: user.id }, select: { image: true } });
  const url = mediaPublicUrl(key);
  await prisma.users.update({ where: { id: user.id }, data: { image: url } });

  const previousKey = previous?.image ? avatarKeyFromUrl(previous.image) : null;
  if (previousKey) await deleteMedia(previousKey).catch(() => undefined);

  return Response.json({ url });
}
