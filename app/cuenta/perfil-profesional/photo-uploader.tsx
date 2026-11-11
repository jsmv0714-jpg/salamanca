"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormError, FormNotice, secondaryButtonClass } from "../../../components/ui/form";
import { useHydrated } from "../../../lib/use-hydrated";
import { removeProfilePhoto } from "./actions";

const MAX_BYTES = 5 * 1024 * 1024;

export default function PhotoUploader({
  currentUrl,
  name,
  roleLabel,
  isLogo,
}: {
  currentUrl: string | null;
  name: string;
  roleLabel: string;
  isLogo: boolean;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setNotice("");
    if (file.size > MAX_BYTES) {
      setError("La foto puede pesar hasta 5 MB.");
      return;
    }

    const body = new FormData();
    body.append("file", file);
    setPending(true);
    try {
      const response = await fetch("/api/cuenta/foto", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "No pudimos subir la foto. Intenta de nuevo.");
        return;
      }
      setNotice(isLogo ? "Logo actualizado." : "Foto actualizada.");
      router.refresh();
    } catch {
      setError("No hay conexión con el servidor. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt={`${isLogo ? "Logo" : "Foto"} de ${name}`}
          className={`h-24 w-24 shrink-0 bg-white object-cover ring-1 ring-unis-lightgray ${isLogo ? "rounded-lg object-contain" : "rounded-full"}`}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`flex h-24 w-24 shrink-0 items-center justify-center bg-unis-bg text-3xl font-black text-unis-red ${isLogo ? "rounded-lg" : "rounded-full"}`}
        >
          {initial}
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-sm text-unis-gray">{roleLabel}</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className={`${secondaryButtonClass} cursor-pointer ${pending || !hydrated ? "pointer-events-none opacity-50" : ""}`}>
            {pending ? "Subiendo..." : currentUrl ? (isLogo ? "Cambiar logo" : "Cambiar foto") : isLogo ? "Subir logo" : "Subir foto"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleChange}
              disabled={pending || !hydrated}
              className="sr-only"
            />
          </label>
          {currentUrl ? (
            <form action={removeProfilePhoto}>
              <button type="submit" className="text-sm font-medium text-unis-gray hover:text-unis-red">
                Quitar {isLogo ? "logo" : "foto"}
              </button>
            </form>
          ) : null}
        </div>
        <p className="text-xs text-unis-gray">JPG, PNG o WebP de hasta 5 MB. La recortamos en cuadrado.</p>
        <FormError message={error} />
        <FormNotice message={notice} />
      </div>
    </div>
  );
}
