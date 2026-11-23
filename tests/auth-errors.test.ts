import { describe, expect, it } from "vitest";
import { authErrorMessage } from "../lib/auth-errors";

describe("mensajes de error de autenticación", () => {
  it("traduce el bloqueo por demasiados intentos", () => {
    expect(authErrorMessage({ status: 429, message: "Too many requests. Please try again later." }, "x")).toBe(
      "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
    );
  });

  it("no revela si un correo ya tiene cuenta al registrarse", () => {
    const message = authErrorMessage({ status: 422, message: "User already exists. Use another email." }, "x");
    expect(message).not.toMatch(/existe|already/i);
    expect(message).toMatch(/recupera tu contraseña/);
  });

  it("usa el mensaje del servidor en otros errores y el de respaldo si no hay mensaje", () => {
    expect(authErrorMessage({ status: 400, message: "Correo inválido" }, "x")).toBe("Correo inválido");
    expect(authErrorMessage({ status: 500 }, "No se pudo")).toBe("No se pudo");
    expect(authErrorMessage(null, "No se pudo")).toBe("No se pudo");
  });
});
