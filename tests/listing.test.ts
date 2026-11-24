import { describe, expect, it } from "vitest";
import { REPORT_DETAILS_MIN, reportDetailsError } from "../lib/reports";
import { relativeTime } from "../lib/dates";
import { authorDisplayName, markSets } from "../lib/listing";

describe("justificación de denuncias", () => {
  it("exige al menos el mínimo de caracteres", () => {
    expect(reportDetailsError("")).not.toBeNull();
    expect(reportDetailsError("x".repeat(REPORT_DETAILS_MIN - 1))).not.toBeNull();
    expect(reportDetailsError("x".repeat(REPORT_DETAILS_MIN))).toBeNull();
  });

  it("no cuenta los espacios de los extremos como justificación", () => {
    expect(reportDetailsError("        corto        ")).not.toBeNull();
  });

  it("rechaza justificaciones demasiado largas", () => {
    expect(reportDetailsError("x".repeat(1001))).toMatch(/Máximo/);
  });
});

describe("tiempo relativo", () => {
  const now = new Date("2026-11-23T15:00:00Z");

  it("describe minutos, horas y días en español", () => {
    expect(relativeTime(new Date(now.getTime() - 30 * 1000), now)).toBe("Hace un momento");
    expect(relativeTime(new Date(now.getTime() - 56 * 60 * 1000), now)).toBe("Hace 56 minutos");
    expect(relativeTime(new Date(now.getTime() - 60 * 60 * 1000), now)).toBe("Hace 1 hora");
    expect(relativeTime(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), now)).toBe("Hace 3 días");
  });
});

describe("autor de la publicación", () => {
  it("usa el nombre de la empresa, la agremiación o el proyecto según el tipo de cuenta", () => {
    expect(authorDisplayName({ name: "Ana", companies: { trade_name: "Gi Group" } })).toBe("Gi Group");
    expect(authorDisplayName({ name: "Ana", associations: { name: "Fenalco" } })).toBe("Fenalco");
    expect(
      authorDisplayName({ name: "Ana", entrepreneurs: { project_name: "Biofarma", first_name: "Ana", last_name: "Ríos" } })
    ).toBe("Biofarma");
    expect(authorDisplayName({ name: "Luis" })).toBe("Luis");
    expect(authorDisplayName({ name: "" })).toBe("Miembro del ecosistema");
  });
});

describe("marcas de guardado y ocultar", () => {
  it("separa los guardados y los ocultos", () => {
    const sets = markSets([
      { id: "a", saved: true, hidden: false },
      { id: "b", saved: false, hidden: true },
      { id: "c", saved: true, hidden: true },
    ]);
    expect([...sets.saved].sort()).toEqual(["a", "c"]);
    expect([...sets.hidden].sort()).toEqual(["b", "c"]);
  });
});
