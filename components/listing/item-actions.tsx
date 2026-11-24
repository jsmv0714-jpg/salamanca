"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Heart, MoreVertical, Share2, X } from "lucide-react";
import { FormError, Field, inputClass, primaryButtonClass, secondaryButtonClass } from "../ui/form";
import { REPORT_DETAILS_MAX, REPORT_DETAILS_MIN, REPORT_REASONS, REPORT_REASON_LABELS } from "../../lib/reports";
import type { FormState } from "../../lib/validation";

type Action = (formData: FormData) => Promise<void>;
type ReportAction = (state: FormState, formData: FormData) => Promise<FormState>;

const iconButton =
  "inline-flex h-11 w-11 items-center justify-center rounded-full bg-unis-bg text-unis-blue transition hover:bg-unis-cyan/15 hover:text-unis-red focus:outline-none focus-visible:ring-2 focus-visible:ring-unis-cyan";

/**
 * Acciones de una publicación o venture en el panel de detalle: me gusta (guardar),
 * compartir, ocultar y denunciar desde el menú de tres puntos.
 */
export default function ItemActions({
  kind,
  id,
  nextPath,
  sharePath,
  shareTitle,
  saved,
  hidden,
  toggleSavedAction,
  toggleHiddenAction,
  reportAction,
  signedIn,
}: {
  kind: "publication" | "venture" | "directory";
  id: string;
  nextPath: string;
  sharePath: string;
  shareTitle: string;
  saved: boolean;
  hidden: boolean;
  toggleSavedAction: Action;
  toggleHiddenAction: Action;
  reportAction: ReportAction;
  signedIn: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function share() {
    const url = `${window.location.origin}${sharePath}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch {
        // El usuario canceló o el navegador no lo permite: se copia el enlace.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function openReport() {
    setMenuOpen(false);
    dialogRef.current?.showModal();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={toggleSavedAction}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="next" value={nextPath} />
        <button
          type="submit"
          aria-pressed={saved}
          aria-label={saved ? "Quitar de guardadas" : "Guardar en mi perfil"}
          title={saved ? "Quitar de guardadas" : "Me gusta: guardar para verla después"}
          className={`${iconButton} ${saved ? "bg-unis-red/10 text-unis-red" : ""}`}
        >
          <Heart className={`h-5 w-5 ${saved ? "fill-unis-red" : ""}`} aria-hidden="true" />
        </button>
      </form>

      <div className="relative">
        <button
          type="button"
          onClick={share}
          aria-label="Compartir"
          title="Compartir enlace"
          className={iconButton}
        >
          <Share2 className="h-5 w-5" aria-hidden="true" />
        </button>
        {copied ? (
          <span role="status" className="absolute left-1/2 top-12 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-unis-text px-2.5 py-1 text-xs font-medium text-white shadow">
            Enlace copiado
          </span>
        ) : null}
      </div>

      <form action={toggleHiddenAction}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="next" value={nextPath} />
        <button
          type="submit"
          aria-label={hidden ? "Mostrar de nuevo" : "Ocultar: no volver a ver esta oferta"}
          title={hidden ? "Mostrar de nuevo" : "No volver a ver esta oferta"}
          className={iconButton}
        >
          {hidden ? <Eye className="h-5 w-5" aria-hidden="true" /> : <EyeOff className="h-5 w-5" aria-hidden="true" />}
        </button>
      </form>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Más opciones"
          className={iconButton}
        >
          <MoreVertical className="h-5 w-5" aria-hidden="true" />
        </button>
        {menuOpen ? (
          <div role="menu" className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-unis-lightgray bg-white p-1.5 shadow-xl">
            {signedIn ? (
              <button
                type="button"
                role="menuitem"
                onClick={openReport}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-unis-text hover:bg-red-50 hover:text-red-700"
              >
                Denunciar ante un administrador
              </button>
            ) : (
              <p className="px-3 py-2 text-sm text-unis-gray">Inicia sesión para denunciar.</p>
            )}
          </div>
        ) : null}
      </div>

      {signedIn ? (
        <ReportDialog
          dialogRef={dialogRef}
          reportAction={reportAction}
          kindLabel={kind === "publication" ? "publicación" : kind === "venture" ? "venture" : "ficha"}
        />
      ) : null}
    </div>
  );
}

function ReportDialog({
  dialogRef,
  reportAction,
  kindLabel,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  reportAction: ReportAction;
  kindLabel: string;
}) {
  const [state, formAction, pending] = useActionState(reportAction, {} as FormState);
  const [details, setDetails] = useState("");
  const sent = state.values?.sent === "1";
  const values = state.values ?? {};
  const reasonValue = typeof values.reason === "string" ? values.reason : "";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="report-title"
      className="w-[min(92vw,32rem)] rounded-2xl border border-unis-lightgray p-0 shadow-2xl backdrop:bg-unis-text/40"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="report-title" className="text-lg font-bold text-unis-text">
            Denunciar esta {kindLabel}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Cerrar"
            className="rounded-full p-1 text-unis-gray hover:bg-unis-bg hover:text-unis-text"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {sent ? (
          <div className="mt-6 space-y-4">
            <p role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Recibimos tu denuncia. Un administrador la revisará.
            </p>
            <button type="button" onClick={() => dialogRef.current?.close()} className={secondaryButtonClass}>
              Cerrar
            </button>
          </div>
        ) : (
          <form action={formAction} className="mt-5 space-y-5" noValidate>
            <FormError message={state.error} />

            <Field label="Motivo" htmlFor="report-reason" error={state.fieldErrors?.reason} required>
              <select id="report-reason" name="reason" defaultValue={reasonValue} className={inputClass}>
                <option value="" disabled>
                  Selecciona un motivo
                </option>
                {REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {REPORT_REASON_LABELS[reason]}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Justifica tu denuncia"
              htmlFor="report-details"
              error={state.fieldErrors?.details}
              hint={`Explica qué encontraste y por qué incumple las normas. Mínimo ${REPORT_DETAILS_MIN} caracteres.`}
              required
            >
              <textarea
                id="report-details"
                name="details"
                rows={5}
                maxLength={REPORT_DETAILS_MAX}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-right text-xs text-unis-gray tabular-nums">
                {details.trim().length} / {REPORT_DETAILS_MIN} mín.
              </p>
            </Field>

            <p className="text-xs text-unis-gray">
              Tu nombre se comparte con los administradores. Las denuncias falsas pueden afectar tu cuenta.
            </p>

            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => dialogRef.current?.close()} className={secondaryButtonClass}>
                Cancelar
              </button>
              <button type="submit" disabled={pending} className={primaryButtonClass}>
                {pending ? "Enviando..." : "Enviar denuncia"}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
