"use client";

import { useState } from "react";
import { authClient } from "../../lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: () => {
          router.push("/publicaciones");
          router.refresh();
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Error al iniciar sesión");
          setLoading(false);
        },
      }
    );
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-black tracking-tight text-unis-text">Iniciar sesión</h1>
        <p className="mt-2 text-center text-sm text-unis-gray">
          Accede a tu cuenta del Marketplace Unisalamanca
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-lg border border-unis-lightgray bg-white px-4 py-8 shadow-sm sm:px-10">
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
              <label htmlFor="password" className="block text-sm font-medium text-unis-text">
                Contraseña
              </label>
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
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-unis-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
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
  );
}
