import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../../lib/session";
import { isSameOrigin } from "../../../../../../lib/origin";
import { MEDIA_LIMITS, detectMedia, formatMediaLimit, limitFor, validateDeclaredMedia } from "../../../../../../lib/media";
import { processImage } from "../../../../../../lib/media-processing";
import { authorizeMediaUpload } from "../../../../../../lib/media-upload";
import {
  deleteMedia,
  mediaPublicUrl,
  putMedia,
  readMedia,
  readMediaPrefix,
  statMedia,
  thumbKeyFor,
} from "../../../../../../lib/storage";

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

const KEY_RE = /^publications\/([0-9a-f-]{36})\/([0-9a-f-]{36})\.(jpg|png|webp|mp4|webm)$/i;

/**
 * Confirma una subida directa: verifica el objeto en el bucket por su firma
 * real, procesa la imagen (sin EXIF) y crea el registro del medio.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSameOrigin(request)) return json({ error: "Petición no permitida." }, 403);

  const user = await getCurrentUser();
  const authorization = await authorizeMediaUpload(user, id);
  if (!authorization.ok) return json({ error: authorization.error }, authorization.status);

  const body = (await request.json().catch(() => null)) as
    | { key?: unknown; mime?: unknown; size?: unknown }
    | null;
  const key = typeof body?.key === "string" ? body.key : "";
  const mime = typeof body?.mime === "string" ? body.mime : "";
  const size = typeof body?.size === "number" ? body.size : Number.NaN;

  const declared = validateDeclaredMedia(mime, size);
  if (!declared.ok) return json({ error: declared.error }, declared.status);

  const keyMatch = KEY_RE.exec(key);
  if (!keyMatch || keyMatch[1].toLowerCase() !== authorization.publicationId.toLowerCase()) {
    return json({ error: "El archivo no pertenece a esta publicación." }, 400);
  }

  // El objeto debe existir y coincidir con lo declarado (la firma limita el tamaño).
  const stored = await statMedia(key);
  if (!stored) return json({ error: "No encontramos el archivo subido. Intenta de nuevo." }, 400);
  if (stored.size !== size || (stored.contentType && stored.contentType !== mime)) {
    await deleteMedia(key).catch(() => null);
    return json({ error: "El archivo subido no coincide con lo esperado. Intenta de nuevo." }, 400);
  }

  // La extensión y el MIME declarados deben coincidir con el contenido real.
  const prefix = await readMediaPrefix(key, 64);
  const detected = prefix ? detectMedia(prefix) : null;
  if (!detected || detected.mime !== mime || detected.kind !== declared.info.kind) {
    await deleteMedia(key).catch(() => null);
    return json({ error: "El contenido del archivo no corresponde a una imagen o video permitido." }, 415);
  }

  let finalSize = size;
  let thumbKey: string | null = null;

  if (detected.kind === "image") {
    const bytes = await readMedia(key);
    if (!bytes) {
      await deleteMedia(key).catch(() => null);
      return json({ error: "No encontramos el archivo subido. Intenta de nuevo." }, 400);
    }
    if (bytes.byteLength > limitFor("image")) {
      await deleteMedia(key).catch(() => null);
      return json({ error: `Las imágenes pueden pesar hasta ${formatMediaLimit("image")}.` }, 413);
    }

    try {
      const processed = await processImage(bytes, mime);
      thumbKey = thumbKeyFor(key);
      await putMedia(key, processed.full.body, processed.full.mime);
      await putMedia(thumbKey, processed.thumb.body, processed.thumb.mime);
      finalSize = processed.full.body.byteLength;
    } catch (error) {
      console.error("No se pudo procesar la imagen subida:", error);
      await Promise.all([deleteMedia(key).catch(() => null), thumbKey ? deleteMedia(thumbKey).catch(() => null) : null]);
      return json({ error: "No se pudo procesar la imagen. Prueba con otro archivo." }, 400);
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const current = await tx.publication_media.count({ where: { publication_id: authorization.publicationId } });
      if (current >= MEDIA_LIMITS.maxPerPublication) throw new Error("MEDIA_LIMIT");
      return tx.publication_media.create({
        data: {
          publication_id: authorization.publicationId,
          kind: detected.kind,
          storage_key: key,
          thumb_key: thumbKey,
          mime_type: mime,
          size_bytes: finalSize,
          position: current,
        },
        select: { id: true, kind: true },
      });
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
  } catch (error) {
    await Promise.all([deleteMedia(key).catch(() => null), thumbKey ? deleteMedia(thumbKey).catch(() => null) : null]);
    if ((error as Error).message === "MEDIA_LIMIT") {
      return json({ error: `Una publicación admite hasta ${MEDIA_LIMITS.maxPerPublication} archivos.` }, 400);
    }
    console.error("No se pudo registrar el medio subido:", error);
    return json({ error: "No se pudo guardar el archivo. Intenta de nuevo." }, 500);
  }
}
