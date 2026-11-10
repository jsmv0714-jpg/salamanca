import { describe, expect, it } from "vitest";
import { pageWindow } from "../components/ui/pagination";

describe("ventana de paginación", () => {
  it("centra las páginas alrededor de la actual", () => {
    expect(pageWindow(5, 10)).toEqual([3, 4, 5, 6, 7]);
  });

  it("no pasa del inicio ni del final", () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(10, 10)).toEqual([6, 7, 8, 9, 10]);
  });

  it("muestra solo las páginas que existen", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });
});
