import { describe, expect, it } from "vitest";
import { formatDate, isPastDeadline, toDateInput } from "../lib/dates";

describe("fechas de columnas DATE", () => {
  it("formatea sin desfase de zona horaria", () => {
    // Medianoche UTC: en Colombia aún es el día anterior, pero la columna DATE
    // representa el 29 y eso es lo que debe mostrarse.
    const text = formatDate(new Date("2026-10-29T00:00:00.000Z"));

    expect(text).toContain("29");
    expect(text).toContain("octubre");
    expect(text).toContain("2026");
    expect(text).not.toContain("28");
  });

  it("convierte a AAAA-MM-DD sin depender de la zona", () => {
    expect(toDateInput(new Date("2026-01-05T00:00:00.000Z"))).toBe("2026-01-05");
    expect(toDateInput(null)).toBe("");
  });

  it("detecta plazos vencidos", () => {
    expect(isPastDeadline(new Date("2020-01-01T00:00:00.000Z"))).toBe(true);
    expect(isPastDeadline(new Date("2999-01-01T00:00:00.000Z"))).toBe(false);
    expect(isPastDeadline(null)).toBe(false);
  });
});
