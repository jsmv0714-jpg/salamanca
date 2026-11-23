import { describe, expect, it } from "vitest";
import { isSameOrigin } from "../lib/origin";

function post(origin?: string) {
  return new Request("http://localhost:3000/api/cuenta/foto", {
    method: "POST",
    headers: origin ? { origin } : {},
  });
}

describe("protección CSRF de las rutas de API", () => {
  it("acepta peticiones desde el mismo origen de la app", () => {
    expect(isSameOrigin(post("http://localhost:3000"))).toBe(true);
  });

  it("rechaza peticiones desde otro sitio", () => {
    expect(isSameOrigin(post("https://sitio-malicioso.example"))).toBe(false);
  });

  it("rechaza peticiones sin cabecera Origin", () => {
    expect(isSameOrigin(post())).toBe(false);
  });
});
