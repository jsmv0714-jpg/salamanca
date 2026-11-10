import { hasRemoteStorage, readLocalMedia } from "../../../lib/storage";

const KEY_PATTERN =
  /^publications\/[0-9a-f-]{36}\/[0-9a-f-]{36}(-thumb)?\.(jpg|png|webp|mp4|webm)$/;
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};

/** Solo para desarrollo: con almacenamiento remoto los archivos los sirve el bucket. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (hasRemoteStorage()) return new Response("No encontrado.", { status: 404 });

  const { key } = await params;
  const storageKey = key.join("/");
  if (!KEY_PATTERN.test(storageKey)) return new Response("No encontrado.", { status: 404 });

  const bytes = await readLocalMedia(storageKey);
  if (!bytes) return new Response("No encontrado.", { status: 404 });

  const extension = storageKey.split(".").pop() ?? "";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": MIME_BY_EXTENSION[extension] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
