"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, FormError, inputClass, primaryButtonClass } from "../../../components/ui/form";
import type { FormState } from "../../../lib/validation";
import { BUSINESS_MODELS, BUSINESS_MODEL_LABELS } from "../../../lib/ventures";

export type DirectoryProfileDefaults = {
  display_name: string;
  headline: string;
  core_expertise: string;
  business_model: string;
  sector_id: string;
  city: string;
  website: string;
  linkedin_url: string;
  logo_url: string;
  contact_email: string;
  is_visible: boolean;
  area_ids: string[];
};

type Option = { id: string; name: string };

export default function DirectoryProfileForm({
  action,
  defaults,
  sectors,
  areas,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: DirectoryProfileDefaults;
  sectors: Option[];
  areas: Option[];
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  const text = (key: Exclude<keyof DirectoryProfileDefaults, "is_visible" | "area_ids">): string => {
    const sent = state.values?.[key];
    return typeof sent === "string" ? sent : defaults[key];
  };
  const selectedAreas = Array.isArray(state.values?.area_ids) ? state.values.area_ids : defaults.area_ids;
  const visible = state.values ? state.values.is_visible === "on" : defaults.is_visible;
  const err = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <FormError message={state.error} />

      <section className="space-y-5 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">Cómo te ve el ecosistema</h2>

        <Field label="Nombre público" htmlFor="display_name" error={err("display_name")} hint="Si lo dejas vacío usamos el nombre de tu registro.">
          <input id="display_name" name="display_name" type="text" maxLength={200} defaultValue={text("display_name")} className={inputClass} />
        </Field>

        <Field label="Frase de presentación" htmlFor="headline" error={err("headline")} hint="Una línea sobre lo que haces (máximo 200 caracteres).">
          <input id="headline" name="headline" type="text" maxLength={200} defaultValue={text("headline")} className={inputClass} />
        </Field>

        <Field
          label="Tu core y la asesoría que ofreces"
          htmlFor="core_expertise"
          error={err("core_expertise")}
          hint="En qué eres especialista y qué puedes aportar a otras empresas, agremiaciones y emprendedores."
        >
          <textarea id="core_expertise" name="core_expertise" rows={5} maxLength={2000} defaultValue={text("core_expertise")} className={inputClass} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Modelo de negocio" htmlFor="business_model" error={err("business_model")}>
            <select id="business_model" name="business_model" defaultValue={text("business_model")} className={inputClass}>
              <option value="">Sin definir</option>
              {BUSINESS_MODELS.map((m) => (
                <option key={m} value={m}>
                  {BUSINESS_MODEL_LABELS[m]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sector" htmlFor="sector_id" error={err("sector_id")}>
            <select id="sector_id" name="sector_id" defaultValue={text("sector_id")} className={inputClass}>
              <option value="">Sin sector</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {areas.length > 0 ? (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-unis-text">Áreas en las que puedes asesorar</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {areas.map((area) => (
                <label key={area.id} className="flex items-center gap-2 text-sm text-unis-gray">
                  <input
                    type="checkbox"
                    name="area_ids"
                    value={area.id}
                    defaultChecked={selectedAreas.includes(area.id)}
                    className="h-4 w-4 rounded border-unis-lightgray text-unis-red focus:ring-unis-red"
                  />
                  {area.name}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
      </section>

      <section className="space-y-5 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">Contacto y presencia</h2>
        <p className="text-xs text-unis-gray">Todo lo que escribas aquí será público cuando actives tu perfil.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ciudad" htmlFor="city" error={err("city")}>
            <input id="city" name="city" type="text" maxLength={100} defaultValue={text("city")} className={inputClass} />
          </Field>
          <Field label="Correo de contacto" htmlFor="contact_email" error={err("contact_email")}>
            <input id="contact_email" name="contact_email" type="email" maxLength={150} defaultValue={text("contact_email")} className={inputClass} />
          </Field>
          <Field label="Sitio web" htmlFor="website" error={err("website")}>
            <input id="website" name="website" type="text" inputMode="url" maxLength={500} placeholder="https://" defaultValue={text("website")} className={inputClass} />
          </Field>
          <Field label="LinkedIn" htmlFor="linkedin_url" error={err("linkedin_url")}>
            <input id="linkedin_url" name="linkedin_url" type="text" inputMode="url" maxLength={500} placeholder="https://" defaultValue={text("linkedin_url")} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Logo o foto (enlace a una imagen)" htmlFor="logo_url" error={err("logo_url")}>
              <input id="logo_url" name="logo_url" type="text" inputMode="url" maxLength={500} placeholder="https://" defaultValue={text("logo_url")} className={inputClass} />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="is_visible"
            defaultChecked={visible}
            className="mt-0.5 h-4 w-4 rounded border-unis-lightgray text-unis-red focus:ring-unis-red"
          />
          <span>
            <span className="block text-sm font-semibold text-unis-text">Aparecer en el directorio</span>
            <span className="block text-xs text-unis-gray">
              Tu perfil será público para quien visite el directorio, siempre que tu cuenta esté activa.
            </span>
          </span>
        </label>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Guardando..." : "Guardar perfil"}
        </button>
        <Link href="/cuenta" className="text-sm font-medium text-unis-gray hover:text-unis-red">
          Volver a mi cuenta
        </Link>
      </div>
    </form>
  );
}
