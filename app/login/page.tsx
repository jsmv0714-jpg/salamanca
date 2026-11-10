"use client";

import { Suspense, useEffect, useState } from "react";
import { authClient } from "../../lib/auth-client";
import { getSafeRedirect } from "../../lib/redirect";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useHydrated } from "../../lib/use-hydrated";
import AuthBackdrop from "../../components/ui/auth-backdrop";
import { authErrorMessage } from "../../lib/auth-errors";

function getRedirectTarget() {
  return getSafeRedirect(new URLSearchParams(window.location.search).get("redirect"));
}

/** Aviso de contraseña restablecida, leído de la URL (`?restablecida=1`). */
function ResetNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("restablecida") !== "1") return null;

  return (
    <p className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      Contraseña actualizada. Ya puedes iniciar sesión.
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hydrated = useHydrated();

  const { data: session } = authClient.useSession();

  // Si ya hay una sesión activa, no tiene sentido mostrar el login.
  useEffect(() => {
    if (session && !loading) {
      router.replace(getRedirectTarget());
    }
  }, [session, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (signInError || !data?.user) {
        const code = (signInError as { code?: string } | null)?.code;
        setError(
          code === "EMAIL_NOT_VERIFIED"
            ? "Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."
            : authErrorMessage(signInError, "Correo o contraseña incorrectos")
        );
        setLoading(false);
        return;
      }

      // Se deja loading=true mientras se navega, para evitar doble envío.
      router.push(getRedirectTarget());
      router.refresh();
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <AuthBackdrop>
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-black tracking-tight text-white">Iniciar sesión</h1>
        <p className="mt-2 text-center text-sm text-white/80">
          Accede a tu cuenta del Marketplace Unisalamanca
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-lg border border-unis-lightgray bg-white px-4 py-8 shadow-sm sm:px-10">
          <Suspense fallback={null}>
            <ResetNotice />
          </Suspense>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-unis-text">
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border border-unis-lightgray px-3 py-2 text-sm text-unis-text shadow-sm focus:border-unis-red focus:outline-none focus:ring-1 focus:ring-unis-red"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-unis-text">
                  Contraseña
                </label>
                <Link href="/recuperar" className="text-xs font-medium text-unis-red hover:underline">
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-unis-lightgray px-3 py-2 text-sm text-unis-text shadow-sm focus:border-unis-red focus:outline-none focus:ring-1 focus:ring-unis-red"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading || !hydrated}
                className="flex w-full justify-center rounded-md bg-unis-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-unis-red-dark disabled:opacity-50"
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-center text-sm text-unis-gray">
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="font-medium text-unis-red hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </AuthBackdrop>
  );
}
