import sharp from "sharp";

/**
 * Procesamiento de imágenes de las publicaciones (solo servidor).
 *
 * Toda imagen se vuelve a codificar con `sharp`, lo que elimina los metadatos
 * EXIF (incluida la ubicación GPS) y limita el tamaño. Además se genera una
 * miniatura WebP para las tarjetas del listado.
 */

export const IMAGE_MAX_DIMENSION = 2000;
export const THUMB_MAX_DIMENSION = 640;

type ImageExtension = "jpg" | "png" | "webp";

export type ProcessedImage = {
  full: { body: Uint8Array; mime: string; extension: ImageExtension };
  thumb: { body: Uint8Array; mime: string; extension: "webp" };
};

/**
 * Normaliza una imagen: aplica la orientación EXIF, quita metadatos y la deja
 * dentro de 2000 px. Devuelve la imagen final y la miniatura de 640 px.
 */
export async function processImage(bytes: Uint8Array, mime: string): Promise<ProcessedImage> {
  const extension: ImageExtension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";

  const fullPipeline = sharp(bytes, { failOn: "error" })
    .rotate()
    .resize({
      width: IMAGE_MAX_DIMENSION,
      height: IMAGE_MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });

  const full =
    extension === "jpg"
      ? await fullPipeline.jpeg({ quality: 82, progressive: true }).toBuffer()
      : extension === "png"
        ? await fullPipeline.png({ compressionLevel: 9 }).toBuffer()
        : await fullPipeline.webp({ quality: 82 }).toBuffer();

  const thumb = await sharp(bytes, { failOn: "error" })
    .rotate()
    .resize({
      width: THUMB_MAX_DIMENSION,
      height: THUMB_MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();

  return {
    full: { body: new Uint8Array(full), mime: `image/${extension === "jpg" ? "jpeg" : extension}`, extension },
    thumb: { body: new Uint8Array(thumb), mime: "image/webp", extension: "webp" },
  };
}
