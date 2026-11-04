"use client";

import { useActionState, useState } from "react";
import { Field, FormError, inputClass, primaryButtonClass } from "../ui/form";
import type { FormState } from "../../lib/validation";
import { applyCopy } from "../../lib/publications";
import { CV_ACCEPT, CV_MAX_BYTES, extensionOf, formatBytes } from "../../lib/cv-file";

export type ApplyDefaults = {
  portfolio_url: string;
  linkedin_url: string;
  phone: string;
};

export default function ApplyForm({
  action,
  typeCode,
  defaults,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  typeCode: string;
  defaults: ApplyDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const copy = applyCopy(typeCode);
  const [fileError, setFileError] = useState<string | undefined>();
  const isInternship = typeCode === "internship";

  const text = (key: keyof ApplyDefaults | "message") => {
    const sent = state.values?.[key];
    if (typeof sent === "string") return sent;
    return key === "message" ? "" : defaults[key];
  };
  const consented = state.values?.data_consent === "on";
  const err = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormError message={state.error} />

      <Field label={copy.message} htmlFor="message" hint={copy.hint} error={err("message")} required>
        <textarea id="message" name="message" rows={5} maxLength={2000} defaultValue={text("message")} className={inputClass} />
      </Field>

      {isInternship ? (
        <>
          <Field
            label="Hoja de vida (PDF o Word)"
            htmlFor="cv_file"
            error={fileError ?? err("cv_file")}
            hint={`Archivo .pdf, .doc o .docx, de hasta ${formatBytes(CV_MAX_BYTES)}.`}
            required
          >
            <input
              id="cv_file"
              name="cv_file"
              type="file"
              accept={CV_ACCEPT}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return setFileError(undefined);
                if (!extensionOf(file.name)) {
                  event.target.value = "";
                  return setFileError("Elige un archivo PDF o Word (.pdf, .doc o .docx).");
                }
                if (file.size > CV_MAX_BYTES) {
                  event.target.value = "";
                  return setFileError(`El archivo pesa ${formatBytes(file.size)}. El máximo es ${formatBytes(CV_MAX_BYTES)}.`);
                }
                setFileError(undefined);
              }}
              className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-unis-bg file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-unis-text`}
            />
            {state.error ? (
              <p className="mt-1 text-xs text-unis-gray">
                Por seguridad el navegador no conserva el archivo: vuelve a seleccionarlo antes de enviar.
              </p>
            ) : null}
          </Field>
          <Field label="Portafolio (opcional)" htmlFor="portfolio_url" error={err("portfolio_url")}>
            <input id="portfolio_url" name="portfolio_url" type="text" inputMode="url" placeholder="https://" defaultValue={text("portfolio_url")} className={inputClass} />
          </Field>
          <Field label="LinkedIn (opcional)" htmlFor="linkedin_url" error={err("linkedin_url")}>
            <input id="linkedin_url" name="linkedin_url" type="text" inputMode="url" placeholder="https://" defaultValue={text("linkedin_url")} className={inputClass} />
          </Field>
        </>
      ) : (
        <Field label="Sitio web o enlace con más información (opcional)" htmlFor="portfolio_url" error={err("portfolio_url")}>
          <input id="portfolio_url" name="portfolio_url" type="text" inputMode="url" placeholder="https://" defaultValue={text("portfolio_url")} className={inputClass} />
        </Field>
      )}

      <Field label="Teléfono de contacto (opcional)" htmlFor="phone" error={err("phone")}>
        <input id="phone" name="phone" type="tel" maxLength={50} defaultValue={text("phone")} className={inputClass} />
      </Field>

      <div>
        <label className="flex items-start gap-2 text-xs text-unis-gray">
          <input
            type="checkbox"
            name="data_consent"
            defaultChecked={consented}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-unis-lightgray text-unis-red focus:ring-unis-red"
          />
          <span>
            Autorizo que mis datos y los enlaces que comparto se entreguen a quien publicó esta oferta y a la
            Universidad de Salamanca Colombia, únicamente para gestionar esta solicitud.
          </span>
        </label>
        {err("data_consent") ? <p className="mt-1 text-xs font-medium text-red-700">{err("data_consent")}</p> : null}
      </div>

      <button type="submit" disabled={pending || Boolean(fileError)} className={`${primaryButtonClass} w-full`}>
        {pending ? "Enviando..." : copy.button}
      </button>
    </form>
  );
}
