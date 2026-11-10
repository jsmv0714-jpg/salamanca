"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, User, UserPlus, X } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import SignOutButton from "../auth/sign-out-button";
import NotificationBell from "../notifications/notification-bell";

const NAV_LINKS = [
  { href: "/publicaciones", label: "Publicaciones" },
  { href: "/directorio", label: "Directorio" },
  { href: "/ventures", label: "Ventures" },
];

type SessionData = ReturnType<typeof authClient.useSession>["data"];

/** Enlace del menú: el de la página actual lleva fondo celeste suave y una línea debajo. */
function navLinkClass(active: boolean) {
  return `relative rounded-xl px-4 py-2 text-[15px] font-semibold transition-colors after:absolute after:inset-x-4 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-unis-cyan after:transition-opacity ${
    active
      ? "bg-unis-cyan/10 text-[#0A7F9E] after:opacity-100"
      : "text-[#5B6B85] after:opacity-0 hover:bg-unis-cyan/10 hover:text-[#0A7F9E]"
  }`;
}

/** Botón con borde celeste, como los de "Estudiantes" y "Docentes" de la página de la universidad. */
const outlineButtonClass =
  "inline-flex items-center gap-2 rounded-xl border-2 border-unis-cyan px-4 py-2 text-sm font-semibold text-unis-red transition hover:bg-unis-cyan/10 hover:shadow-[0_0_0_3px_rgb(22_182_214/0.25)]";

function AuthActions({
  session,
  isPending,
  onNavigate,
}: {
  session: SessionData;
  isPending: boolean;
  onNavigate?: () => void;
}) {
  const firstName = session?.user.name?.trim().split(/\s+/)[0] || "Mi cuenta";

  if (isPending) return null;

  if (session) {
    return (
      <>
        <NotificationBell onNavigate={onNavigate} />
        <Link href="/cuenta" onClick={onNavigate} className={outlineButtonClass}>
          <User className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
          <span className="max-w-32 truncate">{firstName}</span>
        </Link>
        <SignOutButton className="flex items-center gap-1.5 rounded-xl border border-unis-lightgray px-4 py-2 text-sm font-medium text-unis-gray transition hover:border-unis-red hover:text-unis-red disabled:opacity-50" />
      </>
    );
  }

  return (
    <>
      <Link href="/login" onClick={onNavigate} className={outlineButtonClass}>
        <LogIn className="h-4 w-4 text-unis-cyan" aria-hidden="true" />
        Iniciar sesión
      </Link>
      <Link
        href="/registro"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 rounded-xl bg-unis-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-unis-red-dark"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Registrarse
      </Link>
    </>
  );
}

function NavLinkItems({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={navLinkClass(isActive(link.href))}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

/** Lee la ruta actual en cliente; va dentro de Suspense para no bloquear el prerenderizado. */
function CurrentNavLinkItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <NavLinkItems pathname={pathname} onNavigate={onNavigate} />;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="bg-white">
      {/* Franja oscura superior */}
      <div className="h-2 bg-[#2A3A40]" aria-hidden="true" />

      <div className="border-b border-unis-lightgray">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            onClick={closeMenu}
            className="flex shrink-0 items-center gap-3"
            aria-label="UniSalamanca Marketplace, ir al inicio"
          >
            {/* El logo es un SVG con su propia animación de entrada (ver scripts/build-logo.mjs). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-unisalamanca.svg"
              alt="UniSalamanca"
              width={180}
              height={40}
              className="h-9 w-auto sm:h-10"
            />
            <span className="hidden border-l border-unis-lightgray pl-3 text-sm font-medium text-unis-gray sm:inline">
              Marketplace
            </span>
          </Link>

          {/* Menú de escritorio */}
          <div className="hidden items-center gap-1 lg:flex">
            <nav className="flex items-center gap-1" aria-label="Principal">
              <Suspense fallback={<NavLinkItems pathname="" />}>
                <CurrentNavLinkItems />
              </Suspense>
            </nav>
            <div className="ml-4 flex min-h-10 items-center gap-2">
              <AuthActions session={session} isPending={isPending} />
            </div>
          </div>

          {/* Botón del menú en celulares y tabletas */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="menu-movil"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-unis-cyan text-unis-red transition hover:bg-unis-cyan/10 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        {menuOpen ? (
          <div id="menu-movil" className="border-t border-unis-lightgray bg-white lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6" aria-label="Principal">
              <Suspense fallback={<NavLinkItems pathname="" onNavigate={closeMenu} />}>
                <CurrentNavLinkItems onNavigate={closeMenu} />
              </Suspense>
            </nav>
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 pb-4 sm:px-6">
              <AuthActions session={session} isPending={isPending} onNavigate={closeMenu} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Línea de degradado celeste a azul oscuro */}
      <div
        className="h-0.5"
        style={{ background: "linear-gradient(90deg, #16B6D6 0%, #16B6D6 35%, #2A2266 100%)" }}
        aria-hidden="true"
      />
    </header>
  );
}
