/** Tipos de medios que se aceptan en una publicación, validados por su contenido real (no por la extensión). */
export const MEDIA_LIMITS = {
  imageBytes: 5 * 1024 * 1024,
  videoBytes: 50 * 1024 * 1024,
  maxPerPublication: 10,
} as const;

export type MediaKind = "image" | "video";

export type DetectedMedia = {
  kind: MediaKind;
  mime: string;
  extension: "jpg" | "png" | "webp" | "mp4" | "webm";
};

/** Identifica el tipo a partir de los primeros bytes. Devuelve null si no es un formato permitido. */
export function detectMedia(bytes: Uint8Array): DetectedMedia | null {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  if (startsWith([0xff, 0xd8, 0xff])) return { kind: "image", mime: "image/jpeg", extension: "jpg" };
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { kind: "image", mime: "image/png", extension: "png" };
  }
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return { kind: "image", mime: "image/webp", extension: "webp" };
  }
  // MP4 y MOV: la caja "ftyp" aparece en el byte 4.
  if (startsWith([0x66, 0x74, 0x79, 0x70], 4)) return { kind: "video", mime: "video/mp4", extension: "mp4" };
  if (startsWith([0x1a, 0x45, 0xdf, 0xa3])) return { kind: "video", mime: "video/webm", extension: "webm" };
  return null;
}

export function limitFor(kind: MediaKind): number {
  return kind === "image" ? MEDIA_LIMITS.imageBytes : MEDIA_LIMITS.videoBytes;
}

export function formatMediaLimit(kind: MediaKind): string {
  return kind === "image" ? "5 MB" : "50 MB";
}

/** Tipos MIME que el input de archivos debe ofrecer. */
export const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/webm";

/** MIME declarado por el navegador → tipo de medio y extensión de la clave. */
const MEDIA_MIME_INFO: Record<string, { kind: MediaKind; extension: "jpg" | "png" | "webp" | "mp4" | "webm" }> = {
  "image/jpeg": { kind: "image", extension: "jpg" },
  "image/png": { kind: "image", extension: "png" },
  "image/webp": { kind: "image", extension: "webp" },
  "video/mp4": { kind: "video", extension: "mp4" },
  "video/webm": { kind: "video", extension: "webm" },
};

export function mediaInfoForMime(mime: string) {
  return MEDIA_MIME_INFO[mime] ?? null;
}

/** Comprueba que el MIME declarado es permitido y que el peso no excede su límite. */
export function validateDeclaredMedia(mime: string, size: number) {
  const info = mediaInfoForMime(mime);
  if (!info) {
    return {
      ok: false as const,
      status: 415,
      error: "Solo se aceptan imágenes JPG, PNG o WebP, y videos MP4 o WebM.",
    };
  }
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false as const, status: 400, error: "El archivo está vacío." };
  }
  if (size > limitFor(info.kind)) {
    const label = info.kind === "image" ? "Las imágenes" : "Los videos";
    return {
      ok: false as const,
      status: 413,
      error: `${label} pueden pesar hasta ${formatMediaLimit(info.kind)}.`,
    };
  }
  return { ok: true as const, info };
}
