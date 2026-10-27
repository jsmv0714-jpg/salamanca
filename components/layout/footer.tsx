import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Footer() {
  const year = 2026;
  return (
    <footer className="border-t border-unis-lightgray bg-unis-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-unis-red">Universidad de Salamanca Colombia</p>
            <p className="text-sm text-unis-gray">Marketplace - Consultorio Empresarial Winner</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-unis-gray">
            <Link href="#" className="hover:text-unis-red">Términos y condiciones</Link>
            <Link href="#" className="hover:text-unis-red">Política de privacidad</Link>
            <Link href="#" className="hover:text-unis-red">Contacto</Link>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-unis-gray">
          © {year} Universidad de Salamanca Colombia. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
