import { describe, expect, it } from "vitest";
import {
  PUBLICATIONS_PAGE_SIZE,
  canApplyToType,
  canReapply,
  isAuthorRole,
  isModality,
  isPublicationStatus,
  isPublicationTypeCode,
} from "../lib/publications";

describe("validación de publicaciones", () => {
  it("reconoce solo las modalidades del enum", () => {
    expect(isModality("remote")).toBe(true);
    expect(isModality("presential")).toBe(true);
    expect(isModality("inventada")).toBe(false);
    expect(isModality(undefined)).toBe(false);
  });

  it("reconoce solo los tipos de publicación del enum", () => {
    expect(isPublicationTypeCode("internship")).toBe(true);
    expect(isPublicationTypeCode("b2b_offer")).toBe(true);
    expect(isPublicationTypeCode("otro")).toBe(false);
    expect(isPublicationTypeCode(["remote"])).toBe(false);
  });

  it("reconoce solo los estados de publicación del enum", () => {
    expect(isPublicationStatus("published")).toBe(true);
    expect(isPublicationStatus("archivada")).toBe(false);
  });

  it("solo los estudiantes se postulan a prácticas", () => {
    expect(canApplyToType("internship", "student")).toBe(true);
    expect(canApplyToType("internship", "company")).toBe(false);
    expect(canApplyToType("b2b_offer", "company")).toBe(true);
    expect(canApplyToType("b2b_offer", "student")).toBe(false);
  });

  it("solo las empresas y los emprendedores pueden publicar ofertas", () => {
    expect(isAuthorRole("company")).toBe(true);
    expect(isAuthorRole("entrepreneur")).toBe(true);
    expect(isAuthorRole("association")).toBe(false);
    expect(isAuthorRole("teacher")).toBe(false);
    expect(isAuthorRole("student")).toBe(false);
    expect(isAuthorRole("admin")).toBe(false);
  });

  it("permite volver a postularse solo una vez tras retirarse", () => {
    expect(canReapply({ status: "withdrawn", reapplied_at: null })).toBe(true);
    expect(canReapply({ status: "withdrawn", reapplied_at: new Date() })).toBe(false);
    expect(canReapply({ status: "sent", reapplied_at: null })).toBe(false);
    expect(canReapply({ status: "rejected", reapplied_at: null })).toBe(false);
  });

  it("usa un tamaño de página positivo", () => {
    expect(PUBLICATIONS_PAGE_SIZE).toBeGreaterThan(0);
  });
});
