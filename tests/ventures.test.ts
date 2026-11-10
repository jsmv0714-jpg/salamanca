import { describe, expect, it } from "vitest";
import { allowedVentureTypes, isDirectoryRole, isVentureType } from "../lib/ventures";

describe("reglas de ventures y directorio", () => {
  it("cada rol crea solo los tipos de venture permitidos", () => {
    expect(allowedVentureTypes("teacher")).toEqual(["spin_off"]);
    expect(allowedVentureTypes("entrepreneur")).toEqual(["startup"]);
    expect(allowedVentureTypes("student")).toEqual([]);
    expect(allowedVentureTypes("admin")).toEqual(["spin_off", "startup"]);
    expect(allowedVentureTypes("company")).toEqual([]);
  });

  it("valida los tipos de venture", () => {
    expect(isVentureType("startup")).toBe(true);
    expect(isVentureType("ong")).toBe(false);
  });

  it("solo los roles del directorio aparecen en él", () => {
    expect(isDirectoryRole("company")).toBe(true);
    expect(isDirectoryRole("teacher")).toBe(true);
    expect(isDirectoryRole("student")).toBe(false);
    expect(isDirectoryRole("admin")).toBe(false);
  });
});
