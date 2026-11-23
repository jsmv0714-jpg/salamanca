"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Field, FormError, inputClass, primaryButtonClass, secondaryButtonClass } from "../../../components/ui/form";
import { NEWS_LIMITS, NEWS_TYPES, NEWS_TYPE_LABELS, type NewsType } from "../../../lib/news";
import type { FormState } from "../../../lib/validation";

export type NewsFormDefaults = {
  id: string;
  type: string;
  title: string;
  summary: string;
  body: string;
  event_date: string;
  event_location: string;
  event_url: string;
  cover_url: string | null;
  published: boolean;
};

export default function NewsForm({
  action,
  defaults,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: NewsFormDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  const current = (key: keyof Omit<NewsFormDefaults, "cover_url" | "published" | "id">): string => {
    const sent = state.values?.[key];
    return typeof sent === "string" ? sent : defaults[key];
  };
  const err = (key: string) => state.fieldErrors?.[key];

  const [type, setType] = useState<NewsType>(
    (NEWS_TYPES as readonly string[]).includes(current("type")) ? (current("type") as NewsType) : "news"
  );

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <input type="hidden" name="id" value={defaults.id} />
      <FormError message={state.error} />

      <section className="space-y-5 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">Contenido</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tipo" htmlFor="type" error={err("type")} required>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value as NewsType)}
              className={inputClass}
            >
              {NEWS_TYPES.map((value) => (
                <option key={value} value={value}>
                  {NEWS_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Título" htmlFor="title" error={err("title")} required>
          <input
            id="title"
            name="title"
            type="text"
            maxLength={NEWS_LIMITS.title}
            defaultValue={current("title")}
            className={inputClass}
          />
        </Field>

        <Field
          label="Resumen"
          htmlFor="summary"
          error={err("summary")}
          hint={`Una o dos frases que aparecen en el listado y en los correos. Máximo ${NEWS_LIMITS.summary} caracteres.`}
          required
        >
          <textarea
            id="summary"
            name="summary"
            rows={2}
            maxLength={NEWS_LIMITS.summary}
            defaultValue={current("summary")}
            className={inputClass}
          />
        </Field>

        <Field
          label="Contenido"
          htmlFor="body"
          error={err("body")}
          hint="Puedes usar párrafos separados por una línea en blanco, **negrita**, *cursiva*, listas con guiones y enlaces [texto](https://...)."
          required
        >
          <textarea
            id="body"
            name="body"
            rows={14}
            maxLength={NEWS_LIMITS.body}
            defaultValue={current("body")}
            className={`${inputClass} font-mono text-[13px] leading-relaxed`}
          />
        </Field>
      </section>

      {type === "event" ? (
        <section className="space-y-5 rounded-lg border border-unis-cyan/40 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-unis-text">Datos del evento</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Fecha y hora" htmlFor="event_date" error={err("eventDate")} hint="Hora de Colombia." required>
              <input
                id="event_date"
                name="event_date"
                type="datetime-local"
                defaultValue={current("event_date")}
                className={inputClass}
              />
            </Field>
            <Field label="Lugar" htmlFor="event_location" error={err("eventLocation")} hint="Auditorio, aula o enlace de la reunión.">
              <input
                id="event_location"
                name="event_location"
                type="text"
                maxLength={NEWS_LIMITS.location}
                defaultValue={current("event_location")}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Enlace de inscripción" htmlFor="event_url" error={err("eventUrl")} hint="Opcional. Formulario o página para inscribirse.">
            <input
              id="event_url"
              name="event_url"
              type="text"
              inputMode="url"
              placeholder="https://"
              maxLength={NEWS_LIMITS.url}
              defaultValue={current("event_url")}
              className={inputClass}
            />
          </Field>
        </section>
      ) : null}

      <section className="space-y-4 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">Imagen de portada</h2>
        {defaults.cover_url ? (
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={defaults.cover_url} alt="Portada actual" className="h-24 w-40 rounded-md object-cover ring-1 ring-unis-lightgray" />
            <label className="flex items-center gap-2 text-sm text-unis-gray">
              <input type="checkbox" name="remove_cover" className="h-4 w-4 rounded border-unis-lightgray text-unis-red focus:ring-unis-red" />
              Quitar portada
            </label>
          </div>
        ) : null}
        <Field
          label={defaults.cover_url ? "Cambiar portada" : "Portada"}
          htmlFor="cover"
          error={err("cover")}
          hint="JPG, PNG o WebP de hasta 5 MB. La recortamos en formato 16:9."
        >
          <input
            id="cover"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-unis-gray file:mr-4 file:rounded-md file:border-0 file:bg-unis-cyan/10 file:px-4 file:py-2 file:font-semibold file:text-unis-red hover:file:bg-unis-cyan/20"
          />
        </Field>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-unis-lightgray bg-white/95 px-4 py-4 shadow-[0_-8px_24px_-16px_rgba(42,34,102,0.25)] backdrop-blur sm:-mx-0 sm:rounded-2xl sm:border sm:px-6">
        <button type="submit" name="intent" value="publish" disabled={pending} className={primaryButtonClass}>
          {pending ? "Guardando..." : defaults.published ? "Guardar y publicar" : "Publicar"}
        </button>
        <button type="submit" name="intent" value="draft" disabled={pending} className={secondaryButtonClass}>
          Guardar como borrador
        </button>
        <Link href="/admin/noticias" className="text-sm font-medium text-unis-gray hover:text-unis-red">
          Volver al listado
        </Link>
        <p className="ml-auto text-xs text-unis-gray">Publicar avisa por correo a las personas registradas la primera vez.</p>
      </div>
    </form>
  );
}
