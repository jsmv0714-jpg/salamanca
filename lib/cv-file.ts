/** Reglas para las hojas de vida que se adjuntan a una postulación (PDF, Word .doc y .docx). */

/** 4 MB: cabe en el límite de las funciones de servidor de la mayoría de proveedores (Vercel permite 4,5 MB). */
export const CV_MAX_BYTES = 4 * 1024 * 1024;

export const CV_ACCEPT = ".pdf,.doc,.docx";

const MIME_BY_EXTENSION = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export type CvExtension = keyof typeof MIME_BY_EXTENSION;

export function extensionOf(filename: string): CvExtension | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext === "pdf" || ext === "doc" || ext === "docx" ? ext : null;
}

export function mimeFor(extension: CvExtension): string {
  return MIME_BY_EXTENSION[extension];
}

/** Revisa los primeros bytes: que el contenido sea realmente de ese tipo y no un archivo renombrado. */
export function matchesSignature(extension: CvExtension, bytes: Uint8Array): boolean {
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  switch (extension) {
    case "pdf": {
      // La cabecera "%PDF-" debe aparecer en el primer kilobyte.
      const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
      return head.includes("%PDF-");
    }
    case "docx":
      return startsWith([0x50, 0x4b, 0x03, 0x04]); // contenedor ZIP
    case "doc":
      return startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // contenedor OLE
  }
}

/** Nombre de archivo sin rutas ni caracteres de control, de máximo 120 caracteres. */
export function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (clean.length <= 120) return clean || "hoja-de-vida";
  const ext = extensionOf(clean);
  const suffix = ext ? `.${ext}` : "";
  return clean.slice(0, 120 - suffix.length) + suffix;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type CvReadResult =
  | { ok: true; filename: string; mimeType: string; size: number; data: Uint8Array<ArrayBuffer> }
  | { ok: false; error: string };

/** Valida y lee el archivo subido en el formulario. */
export async function readCvFile(file: File): Promise<CvReadResult> {
  const filename = safeFilename(file.name);
  const extension = extensionOf(filename);
  if (!extension) return { ok: false, error: "La hoja de vida debe ser un archivo PDF o Word (.pdf, .doc o .docx)." };
  if (file.size > CV_MAX_BYTES) {
    return { ok: false, error: `El archivo pesa ${formatBytes(file.size)}. El máximo es ${formatBytes(CV_MAX_BYTES)}.` };
  }

  const data = new Uint8Array(await file.arrayBuffer());
  if (data.length === 0) return { ok: false, error: "El archivo está vacío." };
  if (!matchesSignature(extension, data)) {
    return { ok: false, error: "El contenido no corresponde a un archivo PDF o Word válido." };
  }
  return { ok: true, filename, mimeType: mimeFor(extension), size: data.length, data };
}

/** Valor para la cabecera Content-Disposition, con nombre alterno ASCII y nombre real codificado. */
export function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
