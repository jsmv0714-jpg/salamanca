import { randomUUID } from "node:crypto";

/** Clave de almacenamiento para una foto nueva. Cada subida usa un nombre distinto. */
export function avatarKey(userId: string): string {
  return `avatars/${userId}/${randomUUID()}.webp`;
}

/** Recupera la clave de una foto a partir de su URL pública, para poder borrarla. */
export function avatarKeyFromUrl(url: string): string | null {
  const match = url.match(/avatars\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/i);
  return match ? match[0] : null;
}
