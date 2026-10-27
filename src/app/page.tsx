import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-black tracking-tight text-unis-text sm:text-5xl lg:text-6xl">
          Conectamos <span className="text-unis-red">empresas</span>,{" "}
          <span className="text-unis-red">estudiantes</span> y{" "}
          <span className="text-unis-red">emprendedores</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-unis-gray">
          Marketplace del Consultorio Empresarial Winner de la Universidad de Salamanca Colombia.
          Un espacio para generar colaboraciones B2B, ofrecer servicios entre actores y publicar ofertas de prácticas.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
          <Link
            href="/publicaciones"
            className="rounded-md bg-unis-red px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            Ver publicaciones
          </Link>
          <Link
            href="/registro"
            className="rounded-md border border-unis-lightgray px-6 py-3 text-sm font-semibold text-unis-gray transition hover:border-unis-red hover:text-unis-red"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}
