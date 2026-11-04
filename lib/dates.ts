/** Fecha de hoy en Colombia, como "AAAA-MM-DD". */
export function todayInBogota(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

/** "AAAA-MM-DD" a partir de una fecha guardada (columna DATE), sin desfase de zona horaria. */
export function toDateInput(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

/** Texto como "29 de octubre de 2026" para una fecha guardada (columna DATE). */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** ¿Ya pasó el plazo? Se puede aplicar hasta el final del día límite. */
export function isPastDeadline(deadline: Date | null | undefined): boolean {
  if (!deadline) return false;
  return toDateInput(deadline) < todayInBogota();
}
