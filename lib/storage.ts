import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Almacenamiento de imágenes y videos.
 *
 * - Con `S3_BUCKET` configurado (Cloudflare R2, AWS S3, etc.) los archivos van al bucket.
 * - Sin configuración, en desarrollo se guardan en `.uploads/` y los sirve `app/media/[...key]`.
 *   En producción esa ausencia es un error: no se aceptan subidas sin almacenamiento real.
 */

const LOCAL_DIR = path.join(process.cwd(), ".uploads");

function s3Config() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) return null;
  return {
    bucket,
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || "auto",
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  };
}

let s3Client: S3Client | null = null;

function getS3Client(config: NonNullable<ReturnType<typeof s3Config>>): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: Boolean(config.endpoint),
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }
  return s3Client;
}

/** Clave de almacenamiento para un archivo nuevo de una publicación. */
export function newMediaKey(publicationId: string, extension: string): string {
  return `publications/${publicationId}/${randomUUID()}.${extension}`;
}

/** Clave de la miniatura derivada de la clave de una imagen. */
export function thumbKeyFor(key: string): string {
  const match = key.match(/^(.*)\.(jpg|jpeg|png|webp)$/i);
  return match ? `${match[1]}-thumb.webp` : `${key}-thumb.webp`;
}

/** URL pública con la que el navegador carga el archivo. */
export function mediaPublicUrl(key: string): string {
  const base = process.env.MEDIA_PUBLIC_URL;
  return base ? `${base.replace(/\/+$/, "")}/${key}` : `/media/${key}`;
}

export function hasRemoteStorage(): boolean {
  return s3Config() !== null;
}

type StoredObject = { size: number; contentType: string | null };

/** Metadatos de un objeto del bucket; null si no existe. */
export async function statMedia(key: string): Promise<StoredObject | null> {
  const config = s3Config();
  if (!config) return null;

  try {
    const result = await getS3Client(config).send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
    return { size: result.ContentLength ?? 0, contentType: result.ContentType ?? null };
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw error;
  }
}

/**
 * URL firmada para que el navegador suba un archivo directamente al bucket.
 * Solo se usa con almacenamiento remoto; en local se conserva el formulario.
 */
export async function presignPut(key: string, mime: string, size: number): Promise<string> {
  const config = s3Config();
  if (!config) throw new Error("El almacenamiento remoto no está configurado.");

  return getSignedUrl(
    getS3Client(config),
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: mime,
      ContentLength: size,
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn: 300 }
  );
}

/**
 * Lee los primeros bytes de un objeto. En local lee el archivo completo, que
 * como máximo son 50 MB de un video ya validado.
 */
export async function readMediaPrefix(key: string, byteCount = 64): Promise<Uint8Array | null> {
  const config = s3Config();
  if (config) {
    try {
      const result = await getS3Client(config).send(
        new GetObjectCommand({ Bucket: config.bucket, Key: key, Range: `bytes=0-${byteCount - 1}` })
      );
      const body = await result.Body?.transformToByteArray();
      return body ? new Uint8Array(body) : null;
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return null;
      throw error;
    }
  }
  const local = await readLocalMedia(key);
  return local ? local.subarray(0, byteCount) : null;
}

/** Descarga completa, con el límite de tamaño ya validado al firmar la subida. */
export async function readMedia(key: string): Promise<Uint8Array | null> {
  const config = s3Config();
  if (config) {
    try {
      const result = await getS3Client(config).send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
      const body = await result.Body?.transformToByteArray();
      return body ? new Uint8Array(body) : null;
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return null;
      throw error;
    }
  }
  return readLocalMedia(key);
}

export async function putMedia(key: string, body: Uint8Array, mime: string): Promise<void> {
  const config = s3Config();
  if (config) {
    await getS3Client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: mime,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("El almacenamiento de medios no está configurado (S3_BUCKET).");
  }
  const target = localPath(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
}

export async function deleteMedia(key: string): Promise<void> {
  const config = s3Config();
  if (config) {
    await getS3Client(config).send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    return;
  }
  await rm(localPath(key), { force: true });
}

/** Lectura local, solo para el servidor de desarrollo. */
export async function readLocalMedia(key: string): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await readFile(localPath(key)));
  } catch {
    return null;
  }
}

function localPath(key: string): string {
  const target = path.resolve(LOCAL_DIR, key);
  // Impide salir de la carpeta de subidas aunque la clave llegue manipulada.
  if (!target.startsWith(LOCAL_DIR + path.sep)) throw new Error("Clave de medio no válida");
  return target;
}
