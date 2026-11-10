import { describe, expect, it } from "vitest";
import { demotionBlocker } from "../lib/admin-roles";

describe("protección al retirar el rol de administrador", () => {
  it("permite retirar el rol cuando hay otros administradores", () => {
    expect(demotionBlocker("admin", false, 2)).toBeNull();
  });

  it("impide quitarse el propio rol", () => {
    expect(demotionBlocker("admin", true, 5)).toBe("self_demote");
  });

  it("exige que quede al menos un administrador", () => {
    expect(demotionBlocker("admin", false, 1)).toBe("last_admin");
  });

  it("no hace nada si la cuenta ya no es administradora", () => {
    expect(demotionBlocker("company", false, 3)).toBe("not_admin");
  });
});
