import type { ReactNode } from "react";

export const inputClass =
  "block w-full rounded-md border border-unis-lightgray px-3 py-2 text-sm text-unis-text shadow-sm focus:border-unis-red focus:outline-none focus:ring-1 focus:ring-unis-red";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-md bg-unis-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-md border border-unis-lightgray px-5 py-2.5 text-sm font-medium text-unis-gray transition hover:border-unis-red hover:text-unis-red disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-unis-text">
        {label}
        {required ? <span className="text-unis-red"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-unis-gray">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {message}
    </div>
  );
}

export function FormNotice({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
    >
      {message}
    </div>
  );
}
