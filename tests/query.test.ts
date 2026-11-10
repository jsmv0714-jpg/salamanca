import { describe, expect, it } from "vitest";
import { buildQuery, pageNumber, param } from "../lib/query";

describe("parámetros de URL", () => {
  it("ignora valores vacíos, repetidos o que no son texto", () => {
    expect(param(" remote ")).toBe("remote");
    expect(param("")).toBeUndefined();
    expect(param(undefined)).toBeUndefined();
    expect(param(["remote", "hybrid"])).toBeUndefined();
  });

  it("solo acepta números de página enteros y positivos", () => {
    expect(pageNumber("1")).toBe(1);
    expect(pageNumber("4")).toBe(4);
    expect(pageNumber("0")).toBe(1);
    expect(pageNumber("-2")).toBe(1);
    expect(pageNumber("1.5")).toBe(1);
    expect(pageNumber("abc")).toBe(1);
    expect(pageNumber(undefined)).toBe(1);
  });

  it("arma la query conservando filtros y omitiendo vacíos", () => {
    const query = buildQuery(
      { tipo: "internship", carrera: undefined, sector: "tecnologia" },
      { page: "2" }
    );

    expect(query).toBe("?tipo=internship&sector=tecnologia&page=2");
  });

  it("devuelve cadena vacía cuando no hay filtros", () => {
    expect(buildQuery({ tipo: undefined }, { page: undefined })).toBe("");
    expect(buildQuery({ tipo: undefined }, { page: "1" })).toBe("?page=1");
  });
});
