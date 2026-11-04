"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Field, FormError, inputClass, primaryButtonClass, secondaryButtonClass } from "../ui/form";
import type { FormState } from "../../lib/validation";
import { MODALITIES, MODALITY_LABELS } from "../../lib/publications";

export type PublicationFormDefaults = {
  publication_type_id: string;
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  location: string;
  modality: string;
  deadline: string;
  contact_email: string;
  contact_phone: string;
  show_contact: boolean;
  sector_ids: string[];
  career_ids: string[];
  area_ids: string[];
};

type Option = { id: string; name: string };
type TypeOption = { id: string; code: string; name: string };

function CheckboxGroup({
  legend,
  name,
  options,
  selected,
}: {
  legend: string;
  name: string;
  options: Option[];
  selected: string[];
}) {
  if (options.length === 0) return null;
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-unis-text">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.id} className="flex items-center gap-2 text-sm text-unis-gray">
            <input
              type="checkbox"
              name={name}
              value={option.id}
              defaultChecked={selected.includes(option.id)}
              className="h-4 w-4 rounded border-unis-lightgray text-unis-red focus:ring-unis-red"
            />
            {option.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function PublicationForm({
  action,
  defaults,
  types,
  sectors,
  careers,
  areas,
  mode,
  republish = false,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: PublicationFormDefaults;
  types: TypeOption[];
  sectors: Option[];
  careers: Option[];
  areas: Option[];
  mode: "create" | "edit";
  /** Ya fue aprobada: guardar cambios la devuelve a revisión. */
  republish?: boolean;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const [typeId, setTypeId] = useState(defaults.publication_type_id || types[0]?.id || "");
  const typeCode = types.find((t) => t.id === typeId)?.code;

  const text = (key: Exclude<keyof PublicationFormDefaults, "show_contact" | "sector_ids" | "career_ids" | "area_ids" | "publication_type_id">) => {
    const sent = state.values?.[key];
    return typeof sent === "string" ? sent : defaults[key];
  };
  const list = (key: "sector_ids" | "career_ids" | "area_ids") => {
    const sent = state.values?.[key];
    return Array.isArray(sent) ? sent : defaults[key];
  };
  const showContact = state.values ? state.values.show_contact === "on" : defaults.show_contact;
  const err = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <FormError message={state.error} />

      <section className="space-y-5 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">Información de la publicación</h2>

        <Field label="Tipo de publicación" htmlFor="publication_type_id" error={err("publication_type_id")} required>
          <select
            id="publication_type_id"
            name="publication_type_id"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className={inputClass}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Título" htmlFor="title" error={err("title")} required>
          <input id="title" name="title" type="text" maxLength={200} defaultValue={text("title")} className={inputClass} />
        </Field>

        <Field
          label="Descripción"
          htmlFor="description"
          error={err("description")}
          hint="Explica qué ofreces o qué necesitas (mínimo 30 caracteres)."
          required
        >
          <textarea id="description" name="description" rows={6} maxLength={5000} defaultValue={text("description")} className={inputClass} />
        </Field>

        <Field label="Requisitos" htmlFor="requirements" error={err("requirements")}>
          <textarea id="requirements" name="requirements" rows={4} maxLength={3000} defaultValue={text("requirements")} className={inputClass} />
        </Field>

        <Field label="Beneficios" htmlFor="benefits" error={err("benefits")}>
          <textarea id="benefits" name="benefits" rows={4} maxLength={3000} defaultValue={text("benefits")} className={inputClass} />
        </Field>
      </section>

      <section className="space-y-5 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">Modalidad y plazo</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Modalidad" htmlFor="modality" error={err("modality")}>
            <select id="modality" name="modality" defaultValue={text("modality")} className={inputClass}>
              <option value="">Sin definir</option>
              {MODALITIES.map((m) => (
                <option key={m} value={m}>
                  {MODALITY_LABELS[m]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ubicación" htmlFor="location" error={err("location")}>
            <input id="location" name="location" type="text" maxLength={150} defaultValue={text("location")} className={inputClass} />
          </Field>
          <Field label="Fecha límite" htmlFor="deadline" error={err("deadline")} hint="Hasta cuándo se reciben postulaciones.">
            <input id="deadline" name="deadline" type="date" defaultValue={text("deadline")} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="space-y-6 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">A quién va dirigida</h2>
        {typeCode === "internship" ? (
          <CheckboxGroup legend="Carreras" name="career_ids" options={careers} selected={list("career_ids")} />
        ) : null}
        <CheckboxGroup legend="Sectores" name="sector_ids" options={sectors} selected={list("sector_ids")} />
        <CheckboxGroup legend="Áreas de consultoría" name="area_ids" options={areas} selected={list("area_ids")} />
      </section>

      <section className="space-y-5 rounded-lg border border-unis-lightgray bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-unis-text">Contacto</h2>
        <p className="text-xs text-unis-gray">
          Quienes se postulen te escribirán por la plataforma. Estos datos solo se muestran si marcas la casilla.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Correo de contacto" htmlFor="contact_email" error={err("contact_email")}>
            <input id="contact_email" name="contact_email" type="email" maxLength={150} defaultValue={text("contact_email")} className={inputClass} />
          </Field>
          <Field label="Teléfono de contacto" htmlFor="contact_phone" error={err("contact_phone")}>
            <input id="contact_phone" name="contact_phone" type="tel" maxLength={50} defaultValue={text("contact_phone")} className={inputClass} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-unis-gray">
          <input
            type="checkbox"
            name="show_contact"
            defaultChecked={showContact}
            className="h-4 w-4 rounded border-unis-lightgray text-unis-red focus:ring-unis-red"
          />
          Mostrar estos datos de contacto en la publicación
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {republish ? (
          <button type="submit" name="intent" value="review" disabled={pending} className={primaryButtonClass}>
            {pending ? "Guardando..." : "Guardar y enviar a revisión"}
          </button>
        ) : (
          <>
            <button type="submit" name="intent" value="review" disabled={pending} className={primaryButtonClass}>
              {pending ? "Guardando..." : "Enviar a revisión"}
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
          Esta publicación ya está aprobada: al guardar los cambios volverá a revisión y dejará de verse hasta que un administrador la apruebe.
        </p>
      ) : null}
      {mode === "create" ? (
        <p className="text-xs text-unis-gray">
          Un administrador revisará la publicación antes de que aparezca en el listado.
        </p>
      ) : null}
    </form>
  );
}
