import { describe, expect, it } from "vitest";
import { makeNewsSlug, parseEventDate, validateNews, type NewsInput } from "../lib/news";

const base: NewsInput = {
  type: "news",
  title: "Nueva convocatoria de emprendimiento",
  summary: "Abrimos la convocatoria para proyectos de base tecnológica.",
  body: "Los proyectos interesados pueden inscribirse antes del cierre de la convocatoria.",
  eventDate: "",
  eventLocation: "",
  eventUrl: "",
};

describe("fecha de los eventos", () => {
  it("interpreta la hora como Colombia (UTC-5)", () => {
    const date = parseEventDate("2026-11-20T15:00");
    expect(date?.toISOString()).toBe("2026-11-20T20:00:00.000Z");
  });

  it("rechaza textos que no son fecha y hora", () => {
    expect(parseEventDate("")).toBeNull();
    expect(parseEventDate("20/11/2026 3pm")).toBeNull();
    expect(parseEventDate("2026-13-40T99:99")).toBeNull();
  });
});

describe("slug de las noticias", () => {
  it("combina el título con un sufijo corto", () => {
    expect(makeNewsSlug("Convocatoria de Innovación", "a1b2c3")).toBe("convocatoria-de-innovacion-a1b2c3");
  });

  it("no deja guiones al final aunque el título se corte", () => {
    const slug = makeNewsSlug("palabra ".repeat(60), "ff00aa");
    expect(slug).not.toMatch(/--/);
    expect(slug.endsWith("-ff00aa")).toBe(true);
  });
});

describe("validación de noticias", () => {
  it("acepta una noticia correcta y limpia el título", () => {
    const result = validateNews({ ...base, title: "  Nueva   convocatoria  de emprendimiento " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.title).toBe("Nueva convocatoria de emprendimiento");
  });

  it("pide tipo válido, título, resumen y contenido", () => {
    const result = validateNews({ ...base, type: "otro", title: "Hi", summary: "corto", body: "corto" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["body", "summary", "title", "type"]);
    }
  });

  it("un evento necesita fecha y solo guarda los datos del evento en ese caso", () => {
    const missing = validateNews({ ...base, type: "event" });
    expect(!missing.ok && missing.fieldErrors.eventDate).toBeTruthy();

    const ok = validateNews({ ...base, type: "event", eventDate: "2026-11-20T15:00", eventLocation: "Auditorio" });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value.eventStartsAt).toBeInstanceOf(Date);
      expect(ok.value.eventLocation).toBe("Auditorio");
    }

    const notEvent = validateNews({ ...base, type: "news", eventDate: "2026-11-20T15:00", eventLocation: "Auditorio" });
    if (notEvent.ok) {
      expect(notEvent.value.eventStartsAt).toBeNull();
      expect(notEvent.value.eventLocation).toBeNull();
    }
  });

  it("solo acepta enlaces http(s) para la inscripción", () => {
    const bad = validateNews({ ...base, type: "event", eventDate: "2026-11-20T15:00", eventUrl: "javascript:alert(1)" });
    expect(!bad.ok && bad.fieldErrors.eventUrl).toBeTruthy();

    const good = validateNews({ ...base, type: "event", eventDate: "2026-11-20T15:00", eventUrl: "forms.example.com/inscripcion" });
    if (good.ok) expect(good.value.eventUrl).toBe("https://forms.example.com/inscripcion");
  });
});
