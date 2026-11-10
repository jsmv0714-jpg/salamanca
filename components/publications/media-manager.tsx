"use client";

import { useRef, useState } from "react";
import { MEDIA_ACCEPT, MEDIA_LIMITS } from "../../lib/media";
import { secondaryButtonClass } from "../ui/form";

export type MediaItem = { id: string; kind: "image" | "video"; url: string; thumbUrl?: string | null };

type UploadResponse = { id?: string; kind?: "image" | "video"; url?: string; thumbUrl?: string | null; error?: string };

export default function MediaManager({
  publicationId,
  initial,
  directUpload = false,
}: {
  publicationId: string;
  initial: MediaItem[];
  directUpload?: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Con bucket configurado el navegador sube directo y el servidor solo confirma.
  const uploadDirect = async (file: File): Promise<UploadResponse> => {
    const presignResponse = await fetch(`/api/publications/${publicationId}/media/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mime: file.type, size: file.size }),
    });
    const presign = (await presignResponse.json().catch(() => ({}))) as {
      key?: string;
      uploadUrl?: string;
      error?: string;
    };
    if (!presignResponse.ok || !presign.uploadUrl || !presign.key) {
      return { error: presign.error ?? "No se pudo preparar la subida." };
    }

    const putResponse = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putResponse.ok) {
      return { error: "No se pudo enviar el archivo al almacenamiento. Intenta de nuevo." };
    }

    const confirmResponse = await fetch(`/api/publications/${publicationId}/media/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: presign.key, mime: file.type, size: file.size }),
    });
    const confirmed = (await confirmResponse.json().catch(() => ({}))) as UploadResponse;
    if (!confirmResponse.ok) {
      return { error: confirmed.error ?? "No se pudo confirmar la subida." };
    }
    return confirmed;
  };

  const uploadClassic = async (file: File): Promise<UploadResponse> => {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`/api/publications/${publicationId}/media`, { method: "POST", body });
    const data = (await response.json().catch(() => ({}))) as UploadResponse;
    if (!response.ok) return { error: data.error ?? "No se pudo subir el archivo." };
    return data;
  };

  const upload = async (files: FileList) => {
    setError("");
    setBusy(true);

    // Se suben de uno en uno: así cada archivo muestra su propio error si falla.
    for (const file of Array.from(files)) {
      try {
        const data = directUpload ? await uploadDirect(file) : await uploadClassic(file);
        if (data.error || !data.id || !data.url) {
          setError(`${file.name}: ${data.error ?? "No se pudo subir el archivo."}`);
          break;
        }
        setItems((previous) => [
          ...previous,
          { id: data.id as string, kind: data.kind ?? "image", url: data.url as string, thumbUrl: data.thumbUrl ?? null },
        ]);
      } catch {
        setError(`${file.name}: no hubo conexión con el servidor.`);
        break;
      }
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = async (id: string) => {
    if (!window.confirm("¿Quitar este archivo de la publicación?")) return;
    setError("");

    const response = await fetch(`/api/publications/${publicationId}/media/${id}`, { method: "DELETE" });
    if (response.ok) {
      setItems((previous) => previous.filter((item) => item.id !== id));
    } else {
      setError("No se pudo quitar el archivo. Intenta de nuevo.");
    }
  };

  const full = items.length >= MEDIA_LIMITS.maxPerPublication;

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="relative overflow-hidden rounded-xl border border-unis-lightgray bg-unis-bg">
              {item.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbUrl ?? item.url}
                  alt=""
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <video src={item.url} controls preload="metadata" className="aspect-video w-full bg-black" />
              )}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-unis-red shadow-sm transition hover:bg-white"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-unis-gray">Aún no hay imágenes ni videos en esta publicación.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label
          className={`${secondaryButtonClass} cursor-pointer ${full || busy ? "pointer-events-none opacity-50" : ""}`}
        >
          {busy ? "Subiendo…" : "Añadir archivos"}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={MEDIA_ACCEPT}
            disabled={full || busy}
            onChange={(event) => event.target.files && upload(event.target.files)}
            className="sr-only"
          />
        </label>
        <p className="text-xs text-unis-gray">
          Hasta {MEDIA_LIMITS.maxPerPublication} archivos: imágenes JPG, PNG o WebP de 5 MB; videos MP4 o WebM de 50 MB.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
