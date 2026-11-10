import { describe, expect, it } from "vitest";
import { MEDIA_LIMITS, detectMedia, limitFor, mediaInfoForMime, validateDeclaredMedia } from "../lib/media";
import { thumbKeyFor } from "../lib/storage";

const bytes = (...values: number[]) => new Uint8Array(values);

describe("detección de medios por contenido", () => {
  it("reconoce JPG, PNG y WebP", () => {
    expect(detectMedia(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe("image/jpeg");
    expect(detectMedia(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.mime).toBe("image/png");
    expect(detectMedia(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))?.mime).toBe("image/webp");
  });

  it("reconoce MP4 (caja ftyp) y WebM", () => {
    expect(detectMedia(bytes(0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70))).toEqual({
      kind: "video",
      mime: "video/mp4",
      extension: "mp4",
    });
    expect(detectMedia(bytes(0x1a, 0x45, 0xdf, 0xa3))?.kind).toBe("video");
  });

  it("rechaza archivos que no son medios aunque tengan otra extensión", () => {
    expect(detectMedia(bytes(0x25, 0x50, 0x44, 0x46))).toBeNull(); // PDF
    expect(detectMedia(bytes(0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74))).toBeNull(); // HTML
    expect(detectMedia(new Uint8Array())).toBeNull();
  });
});

describe("límites de tamaño", () => {
  it("imágenes hasta 5 MB y videos hasta 50 MB", () => {
    expect(limitFor("image")).toBe(5 * 1024 * 1024);
    expect(limitFor("video")).toBe(50 * 1024 * 1024);
    expect(MEDIA_LIMITS.maxPerPublication).toBe(10);
  });
});

describe("subida directa", () => {
  it("reconoce el MIME declarado y su extensión", () => {
    expect(mediaInfoForMime("image/jpeg")).toEqual({ kind: "image", extension: "jpg" });
    expect(mediaInfoForMime("video/webm")).toEqual({ kind: "video", extension: "webm" });
    expect(mediaInfoForMime("application/pdf")).toBeNull();
  });

  it("valida MIME y peso antes de firmar la subida", () => {
    expect(validateDeclaredMedia("image/jpeg", 1024).ok).toBe(true);
    expect(validateDeclaredMedia("video/mp4", MEDIA_LIMITS.videoBytes).ok).toBe(true);
    expect(validateDeclaredMedia("application/pdf", 1024)).toMatchObject({ ok: false, status: 415 });
    expect(validateDeclaredMedia("image/png", 0)).toMatchObject({ ok: false, status: 400 });
    expect(validateDeclaredMedia("image/png", MEDIA_LIMITS.imageBytes + 1)).toMatchObject({
      ok: false,
      status: 413,
    });
  });

  it("deriva la clave de la miniatura de la clave original", () => {
    expect(thumbKeyFor("publications/a/b.jpg")).toBe("publications/a/b-thumb.webp");
    expect(thumbKeyFor("publications/a/b.webp")).toBe("publications/a/b-thumb.webp");
    expect(thumbKeyFor("publications/a/b")).toBe("publications/a/b-thumb.webp");
  });
});
