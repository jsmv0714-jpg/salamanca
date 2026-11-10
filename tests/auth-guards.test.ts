import { describe, expect, it } from "vitest";
import { stripProtectedUserFields } from "../lib/auth-guards";

describe("stripProtectedUserFields", () => {
  it("quita role y status enviados por el cliente", () => {
    const result = stripProtectedUserFields({
      name: "Ana",
      email: "ana@example.com",
      role: "admin",
      status: "active",
    });

    expect(result).toEqual({ name: "Ana", email: "ana@example.com" });
    expect(result).not.toHaveProperty("role");
    expect(result).not.toHaveProperty("status");
  });

  it("conserva los campos legítimos aunque no haya protegidos", () => {
    expect(stripProtectedUserFields({ name: "Luis" })).toEqual({ name: "Luis" });
  });

  it("no muta el objeto original", () => {
    const input = { name: "Eva", role: "student" };
    stripProtectedUserFields(input);

    expect(input.role).toBe("student");
  });
});
