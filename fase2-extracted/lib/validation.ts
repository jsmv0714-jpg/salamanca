/** Estado que devuelven las acciones de formulario (useActionState). */
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Valores enviados, para no perder lo que la persona escribió si hay un error. */
  values?: Record<string, string | string[]>;
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getStringList(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((v): v is string => typeof v === "string");
}

/** Solo http(s): evita enlaces tipo "javascript:" en href o src. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Si la persona escribe "miweb.com" sin protocolo, le agregamos https://. */
export function normalizeUrl(value: string): string {
  if (!value) return value;
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
}
