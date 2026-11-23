import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/session";
import { isSameOrigin } from "../../../../../lib/origin";
import { MEDIA_LIMITS, detectMedia, formatMediaLimit, limitFor } from "../../../../../lib/media";
import { processImage } from "../../../../../lib/media-processing";
import { authorizeMediaUpload } from "../../../../../lib/media-upload";
import { deleteMedia, mediaPublicUrl, newMediaKey, putMedia, thumbKeyFor } from "../../../../../lib/storage";

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

/** Sube una imagen o video a una publicación propia (o cualquiera, si es admin). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSameOrigin(request)) return json({ error: "Petición no permitida." }, 403);

  const user = await getCurrentUser();
  const authorization = await authorizeMediaUpload(user, id);
  if (!authorization.ok) return json({ error: authorization.error }, authorization.status);

  const publicationId = authorization.publicationId;
  const current = authorization.current;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json({ error: "Selecciona un archivo." }, 400);

  // Corte rápido antes de leer el archivo completo en memoria.
  if (file.size > MEDIA_LIMITS.videoBytes) {
    return json({ error: `El archivo supera el máximo permitido (${formatMediaLimit("video")}).` }, 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectMedia(bytes);
  if (!detected) {
    return json({ error: "Solo se aceptan imágenes JPG, PNG o WebP, y videos MP4 o WebM." }, 415);
  }
  if (bytes.byteLength > limitFor(detected.kind)) {
    const label = detected.kind === "image" ? "Las imágenes" : "Los videos";
    return json({ error: `${label} pueden pesar hasta ${formatMediaLimit(detected.kind)}.` }, 413);
  }

  let body: Uint8Array = bytes;
  let mime = detected.mime;
  let extension = detected.extension;
  let thumb: Uint8Array | null = null;

  if (detected.kind === "image") {
    try {
      const processed = await processImage(bytes, detected.mime);
      body = processed.full.body;
      mime = processed.full.mime;
      extension = processed.full.extension;
      thumb = processed.thumb.body;
    } catch (error) {
      console.error("No se pudo procesar la imagen:", error);
      return json({ error: "No se pudo procesar la imagen. Prueba con otro archivo." }, 400);
    }
  }

  const key = newMediaKey(publicationId, extension);
  const thumbKey = thumb ? thumbKeyFor(key) : null;

  try {
    await putMedia(key, body, mime);
    if (thumb && thumbKey) await putMedia(thumbKey, thumb, "image/webp");
  } catch (error) {
    console.error("No se pudo guardar el archivo de la publicación:", error);
    await deleteMedia(key).catch(() => null);
    if (thumbKey) await deleteMedia(thumbKey).catch(() => null);
    return json({ error: "No se pudo guardar el archivo. Intenta de nuevo." }, 500);
  }

  const created = await prisma.publication_media.create({
    data: {
      publication_id: publicationId,
      kind: detected.kind,
      storage_key: key,
      thumb_key: thumbKey,
      mime_type: mime,
      size_bytes: body.byteLength,
      position: current,
    },
    select: { id: true, kind: true },
  });

  return json(
    {
      id: created.id,
      kind: created.kind,
      url: mediaPublicUrl(key),
      thumbUrl: thumbKey ? mediaPublicUrl(thumbKey) : null,
    },
    201
  );
}
