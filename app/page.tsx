import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RevealText from "../components/ui/reveal-text";
import Reveal from "../components/ui/reveal";

export default function HomePage() {
  return (
    <section className="relative overflow-hidden">
      {/* Resplandor celeste muy suave detrás del título */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[30rem]"
        style={{ background: "radial-gradient(60% 60% at 50% 0%, rgba(22, 182, 214, 0.10), transparent)" }}
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-16 text-center sm:px-6 sm:pt-24 lg:px-8">
        <RevealText
          as="h1"
          className="text-4xl font-black leading-[1.08] tracking-tight text-unis-text sm:text-6xl lg:text-7xl"
          parts={[
            { text: "Conectamos" },
            { text: "empresas,", className: "text-unis-red" },
            { text: "estudiantes y emprendedores", className: "text-unis-red" },
          ]}
        />

        <Reveal delay={950} className="mx-auto mt-8 max-w-3xl">
          <p className="text-lg leading-relaxed text-unis-gray sm:text-xl">
            Marketplace del Consultorio Empresarial Winner de la Universidad de Salamanca Colombia. Un espacio para
            generar colaboraciones B2B, ofrecer servicios entre actores y publicar ofertas de prácticas.
          </p>
        </Reveal>

        <Reveal delay={1150} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/publicaciones"
            className="group inline-flex items-center gap-2 rounded-xl bg-unis-red px-7 py-3.5 text-base font-semibold text-white"
          >
            Ver publicaciones
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link
            href="/registro"
            className="inline-flex items-center rounded-md border border-unis-lightgray px-7 py-3.5 text-base font-semibold text-unis-text"
          >
            Crear cuenta
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
