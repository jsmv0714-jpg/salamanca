/** Se muestra mientras cambia de página: la cabecera y el pie se mantienen. */
export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 py-16" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-unis-lightgray border-t-unis-cyan" aria-hidden="true" />
      <p className="mt-4 text-sm text-unis-gray">Cargando…</p>
      <span className="sr-only">Cargando la página</span>
    </div>
  );
}
