type Raw = string | string[] | undefined;

/** Toma un parámetro de URL como texto; si viene repetido o vacío, lo ignora. */
export function param(value: Raw): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/** Arma "?a=1&b=2" combinando los filtros actuales con los cambios; omite los vacíos. */
export function buildQuery(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | undefined> = {}
): string {
  const merged = { ...base, ...overrides };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** Para comparar texto sin importar tildes ni mayúsculas. */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
