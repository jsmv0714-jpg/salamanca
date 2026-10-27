import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-unis-lightgray bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 items-center">
            <span className="text-lg font-black text-unis-red">UNISALAMANCA</span>
            <span className="ml-2 text-sm font-medium text-unis-gray">Marketplace</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/publicaciones" className="text-sm font-medium text-unis-gray transition hover:text-unis-red">
            Publicaciones
          </Link>
          <Link href="/directorio" className="text-sm font-medium text-unis-gray transition hover:text-unis-red">
            Directorio
          </Link>
          <Link href="/ventures" className="text-sm font-medium text-unis-gray transition hover:text-unis-red">
            Ventures
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-unis-gray transition hover:text-unis-red">
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="rounded-md bg-unis-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </header>
  );
}
