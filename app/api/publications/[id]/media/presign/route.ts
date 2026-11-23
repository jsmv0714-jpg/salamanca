import { getCurrentUser } from "../../../../../../lib/session";
import { isSameOrigin } from "../../../../../../lib/origin";
import { validateDeclaredMedia } from "../../../../../../lib/media";
import { authorizeMediaUpload } from "../../../../../../lib/media-upload";
import { hasRemoteStorage, newMediaKey, presignPut } from "../../../../../../lib/storage";

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

/** Devuelve una URL firmada para subir el archivo directamente al bucket. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSameOrigin(request)) return json({ error: "Petición no permitida." }, 403);

  const user = await getCurrentUser();
  const authorization = await authorizeMediaUpload(user, id);
  if (!authorization.ok) return json({ error: authorization.error }, authorization.status);

  if (!hasRemoteStorage()) {
    return json({ error: "La subida directa no está disponible sin almacenamiento remoto." }, 400);
  }

  const body = (await request.json().catch(() => null)) as { mime?: unknown; size?: unknown } | null;
  const mime = typeof body?.mime === "string" ? body.mime : "";
  const size = typeof body?.size === "number" ? body.size : Number.NaN;

  const declared = validateDeclaredMedia(mime, size);
  if (!declared.ok) return json({ error: declared.error }, declared.status);

  const key = newMediaKey(authorization.publicationId, declared.info.extension);

  try {
    const uploadUrl = await presignPut(key, mime, size);
    return json({ key, uploadUrl }, 200);
  } catch (error) {
    console.error("No se pudo firmar la subida del medio:", error);
    return json({ error: "No se pudo preparar la subida. Intenta de nuevo." }, 500);
  }
}
