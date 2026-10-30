"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Field, FormError, inputClass, primaryButtonClass, secondaryButtonClass } from "../ui/form";
import type { FormState } from "../../lib/validation";
import {
  BUSINESS_MODELS,
  BUSINESS_MODEL_LABELS,
  SERVICE_STAGES,
  TRL_PHASES,
  VENTURE_TYPE_HELP,
  VENTURE_TYPE_LABELS,
  type VentureType,
} from "../../lib/ventures";

export type VentureFormDefaults = {
  type: VentureType;
  name: string;
  tagline: string;
  description: string;
  sector_id: string;
  business_model: string;
  trl_level: string;
  service_stage: string;
  research_group: string;
  senior_consultant: string;
  city: string;
  logo_url: string;
  website: string;
  linkedin_url: string;
  contact_email: string;
  area_ids: string[];
};

type Option = { id: string; name: string };

export default function VentureForm({
  action,
  defaults,
  sectors,
  areas,
  allowedTypes,
  mode,
  republish = false,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: VentureFormDefaults;
  sectors: Option[];
  areas: Option[];
  allowedTypes: VentureType[];
  mode: "create" | "edit";
  /** La venture ya está publicada: guardar cambios la envía de nuevo a revisión. */
  republish?: boolean;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const [type, setType] = useState<VentureType>(defaults.type);

  // Si el servidor devolvió un error, se conserva lo que la persona había escrito.
  const text = (key: Exclude<keyof VentureFormDefaults, "area_ids" | "type">): string => {
    const sent = state.values?.[key];
    return typeof sent === "string" ? sent : defaults[key];
  };
  const selectedAreas = Array.isArray(state.values?.area_ids)
    ? state.values.area_ids
    : defaults.area_ids;
  const err = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <FormError message={state.error} />

      <section className="space-y-5 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">Información básica</h2>

        {allowedTypes.length > 1 ? (
          <Field label="Tipo de venture" htmlFor="type" error={err("type")} required>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as VentureType)}
              className={inputClass}
            >
              {allowedTypes.map((t) => (
                <option key={t} value={t}>
                  {VENTURE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-unis-gray">{VENTURE_TYPE_HELP[type]}</p>
          </Field>
        ) : (
          <div>
            <input type="hidden" name="type" value={type} />
            <p className="text-sm font-medium text-unis-text">
              Tipo de venture: <span className="font-bold">{VENTURE_TYPE_LABELS[type]}</span>
            </p>
            <p className="mt-1 text-xs text-unis-gray">{VENTURE_TYPE_HELP[type]}</p>
          </div>
        )}

        <Field label="Nombre" htmlFor="name" error={err("name")} required>
          <input id="name" name="name" type="text" maxLength={150} defaultValue={text("name")} className={inputClass} />
        </Field>

        <Field
          label="Frase corta"
          htmlFor="tagline"
          hint="Una línea que explique qué hace (máximo 200 caracteres)."
          error={err("tagline")}
        >
          <input id="tagline" name="tagline" type="text" maxLength={200} defaultValue={text("tagline")} className={inputClass} />
        </Field>

        <Field
          label="Descripción"
          htmlFor="description"
          hint="Qué problema resuelve, para quién y qué lo hace diferente (mínimo 30 caracteres)."
          error={err("description")}
          required
        >
          <textarea id="description" name="description" rows={6} maxLength={5000} defaultValue={text("description")} className={inputClass} />
        </Field>
      </section>

      <section className="space-y-5 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">Madurez y mercado</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nivel TRL" htmlFor="trl_level" error={err("trl_level")} hint="Escala de madurez tecnológica de 1 a 9." required>
            <select id="trl_level" name="trl_level" defaultValue={text("trl_level")} className={inputClass}>
              {TRL_PHASES.map((phase) => (
                <optgroup key={phase.key} label={`${phase.label} (TRL ${phase.min}-${phase.max})`}>
                  {Array.from({ length: phase.max - phase.min + 1 }, (_, i) => phase.min + i).map((level) => (
                    <option key={level} value={level}>
                      TRL {level}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field
            label="Etapa del servicio Winner"
            htmlFor="service_stage"
            error={err("service_stage")}
            hint="Etapa del consultorio de donde sale esta venture."
          >
            <select id="service_stage" name="service_stage" defaultValue={text("service_stage")} className={inputClass}>
              <option value="">Sin definir</option>
              {SERVICE_STAGES.map((stage, i) => (
                <option key={stage} value={i + 1}>
                  {i + 1}. {stage}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Modelo de negocio" htmlFor="business_model" error={err("business_model")} required>
            <select id="business_model" name="business_model" defaultValue={text("business_model")} className={inputClass}>
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
            <legend className="mb-2 text-sm font-medium text-unis-text">Áreas de consultoría relacionadas</legend>
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

      {type === "spin_off" ? (
        <section className="space-y-5 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-unis-text">Origen del conocimiento</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Grupo de investigación" htmlFor="research_group" error={err("research_group")} required>
              <input id="research_group" name="research_group" type="text" maxLength={150} defaultValue={text("research_group")} className={inputClass} />
            </Field>
            <Field label="Consultor senior responsable" htmlFor="senior_consultant" error={err("senior_consultant")}>
              <input id="senior_consultant" name="senior_consultant" type="text" maxLength={150} defaultValue={text("senior_consultant")} className={inputClass} />
            </Field>
          </div>
        </section>
      ) : null}

      <section className="space-y-5 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">Contacto y presencia</h2>
        <p className="text-xs text-unis-gray">Todo lo que escribas aquí se verá públicamente cuando la venture esté publicada.</p>
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
            <Field label="Logo (enlace a una imagen)" htmlFor="logo_url" error={err("logo_url")}>
              <input id="logo_url" name="logo_url" type="text" inputMode="url" maxLength={500} placeholder="https://" defaultValue={text("logo_url")} className={inputClass} />
            </Field>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {republish ? (
          <button type="submit" name="intent" value="review" disabled={pending} className={primaryButtonClass}>
            {pending ? "Guardando..." : "Guardar y enviar a revisión"}
          </button>
        ) : (
          <>
            <button type="submit" name="intent" value="review" disabled={pending} className={primaryButtonClass}>
              {pending ? "Guardando..." : mode === "create" ? "Enviar a revisión" : "Guardar y enviar a revisión"}
            </button>
            <button type="submit" name="intent" value="draft" disabled={pending} className={secondaryButtonClass}>
              Guardar borrador
            </button>
          </>
        )}
        <Link href={cancelHref} className="text-sm font-medium text-unis-gray hover:text-unis-red">
          Cancelar
        </Link>
      </div>
      {republish ? (
        <p className="text-xs text-unis-gray">
          Esta venture ya está publicada: al guardar los cambios volverá a revisión y dejará de verse hasta que un administrador la apruebe.
        </p>
      ) : null}
    </form>
  );
}
