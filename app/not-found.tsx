import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-unis-red">404</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-unis-text sm:text-4xl">
        Esta página no existe
      </h1>
      <p className="mt-3 text-sm text-unis-gray">
        Puede que el enlace esté mal escrito o que el contenido ya no esté disponible.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-unis-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
        >
          Ir al inicio
        </Link>
        <Link
          href="/publicaciones"
          className="rounded-md border border-unis-lightgray px-5 py-2.5 text-sm font-medium text-unis-gray transition hover:border-unis-red hover:text-unis-red"
        >
          Ver publicaciones
        </Link>
      </div>
    </div>
  );
}
