import { describe, expect, it } from "vitest";
import {
  PROFILE_COPY,
  buildChecklist,
  ROLE_FIELDS,
  SKILL_MAX_COUNT,
  copyFor,
  parseSkills,
  readSocialLinks,
  safeHttpUrl,
  socialUrlError,
  splitName,
} from "../lib/profile";

describe("habilidades del perfil", () => {
  it("separa por comas, quita vacíos y repetidos sin distinguir mayúsculas", () => {
    expect(parseSkills(" Excel, python ,, EXCEL,  redacción ")).toEqual({
      skills: ["Excel", "python", "redacción"],
    });
  });

  it("colapsa espacios internos", () => {
    expect(parseSkills("Gestión   de   proyectos")).toEqual({ skills: ["Gestión de proyectos"] });
  });

  it("rechaza más habilidades que el máximo", () => {
    const raw = Array.from({ length: SKILL_MAX_COUNT + 1 }, (_, i) => `habilidad ${i}`).join(",");
    expect(parseSkills(raw).error).toMatch(/hasta 15/);
  });

  it("rechaza una habilidad demasiado larga", () => {
    expect(parseSkills("x".repeat(41)).error).toMatch(/40 caracteres/);
  });
});

describe("redes sociales", () => {
  it("acepta el enlace de la red correspondiente y sus subdominios", () => {
    expect(socialUrlError("linkedin", "https://www.linkedin.com/in/ana")).toBeNull();
    expect(socialUrlError("x", "twitter.com/ana")).toBeNull();
    expect(socialUrlError("instagram", "https://instagram.com/ana")).toBeNull();
  });

  it("rechaza un enlace de otra red", () => {
    expect(socialUrlError("linkedin", "https://instagram.com/ana")).toMatch(/LinkedIn/);
  });

  it("no acepta esquemas peligrosos ni dominios que solo terminan igual", () => {
    expect(socialUrlError("linkedin", "javascript:alert(1)")).not.toBeNull();
    expect(socialUrlError("linkedin", "https://notlinkedin.com/in/ana")).not.toBeNull();
  });

  it("lee solo las redes conocidas de lo guardado", () => {
    expect(readSocialLinks({ linkedin: "https://linkedin.com/in/a", tiktok: "https://tiktok.com/@a", x: 3 })).toEqual({
      linkedin: "https://linkedin.com/in/a",
    });
    expect(readSocialLinks(null)).toEqual({});
    expect(readSocialLinks(["https://linkedin.com"])).toEqual({});
  });
});

describe("nombres y enlaces", () => {
  it("divide el nombre en nombre y apellidos", () => {
    expect(splitName("María Fernanda Pérez Gómez")).toEqual({ first: "María", last: "Fernanda Pérez Gómez" });
    expect(splitName("Solo")).toEqual({ first: "Solo", last: "" });
    expect(splitName("   ")).toEqual({ first: "", last: "" });
  });

  it("solo devuelve enlaces http(s) listos para mostrar", () => {
    expect(safeHttpUrl("miweb.com")).toBe("https://miweb.com");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("")).toBeNull();
  });
});

describe("lista de completitud", () => {
  const empty = {
    role: "student",
    hasPhoto: false,
    headline: null,
    bio: null,
    skillCount: 0,
    city: null,
    contactPhone: null,
    contactEmail: null,
    socialCount: 0,
    roleValues: {},
  };

  it("un perfil vacío está al 0%", () => {
    const { percent, items } = buildChecklist(empty);
    expect(percent).toBe(0);
    expect(items.map((i) => i.key)).toContain("career_id");
  });

  it("cuenta lo completado y pide los campos propios del rol", () => {
    const result = buildChecklist({
      ...empty,
      hasPhoto: true,
      headline: "Estudiante",
      bio: "Hola",
      skillCount: 3,
      city: "Salamanca",
      contactEmail: "a@b.co",
      socialCount: 1,
      roleValues: { career_id: "x", semester: "" },
    });
    const missing = result.items.filter((i) => !i.done).map((i) => i.key);
    expect(missing).toEqual(["semester"]);
    expect(result.percent).toBe(Math.round((8 / 9) * 100));
  });

  it("la empresa pide sector y el logo en lugar de la foto", () => {
    const result = buildChecklist({ ...empty, role: "company" });
    expect(result.items.find((i) => i.key === "photo")?.label).toBe("Logo");
    expect(result.items.map((i) => i.key)).toContain("sector_id");
    expect(result.items.map((i) => i.key)).not.toContain("career_id");
  });
});

describe("reglas por rol", () => {
  it("cada rol tiene su texto propio", () => {
    expect(copyFor("student").skills.label).toBe("Habilidades");
    expect(copyFor("company").skills.label).toBe("Servicios y capacidades");
    expect(copyFor("association").skills.label).toBe("Servicios que ofrece");
    expect(copyFor("teacher").skills.label).toBe("Áreas de experiencia");
    expect(copyFor("unknown").bio.label).toBe(PROFILE_COPY.admin.bio.label);
  });

  it("los campos de cada rol no se mezclan", () => {
    expect(ROLE_FIELDS.student).toContain("career_id");
    expect(ROLE_FIELDS.student).not.toContain("sector_id");
    expect(ROLE_FIELDS.company).toContain("sector_id");
    expect(ROLE_FIELDS.company).not.toContain("career_id");
    expect(ROLE_FIELDS.entrepreneur).toEqual(["project_name"]);
    expect(ROLE_FIELDS.admin).toEqual([]);
  });
});
