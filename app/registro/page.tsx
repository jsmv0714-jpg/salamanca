"use client";

import { useEffect, useState } from "react";
import { authClient } from "../../lib/auth-client";
import { getSafeRedirect } from "../../lib/redirect";
import Link from "next/link";
import { useRouter } from "next/navigation";

function getRedirectTarget() {
  return getSafeRedirect(new URLSearchParams(window.location.search).get("redirect"));
}

const roles = [
  { value: "student", label: "Estudiante" },
  { value: "company", label: "Empresa / PyME" },
  { value: "association", label: "Agremiación" },
  { value: "entrepreneur", label: "Emprendedor" },
  { value: "teacher", label: "Docente / Consultor Senior" },
];

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: session } = authClient.useSession();

  // Si ya hay una sesión activa, no tiene sentido mostrar el registro.
  useEffect(() => {
    if (session && !loading) {
      router.replace(getRedirectTarget());
    }
  }, [session, loading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signUpError } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim(),
        role,
      });

      // 1. El registro debe haber devuelto un usuario creado
      if (signUpError || !data?.user) {
        setError(signUpError?.message || "No se pudo completar el registro");
        setLoading(false);
        return;
      }

      // 2. Confirmar que la sesión quedó activa antes de redirigir
      const { data: activeSession } = await authClient.getSession();
      if (!activeSession) {
        setError(
          "Tu cuenta se creó, pero no se pudo iniciar la sesión. Intenta iniciar sesión manualmente."
        );
        setLoading(false);
        return;
      }

      // Se deja loading=true mientras se navega, para evitar doble envío.
      router.push(getRedirectTarget());
      router.refresh();
    } catch (err) {
      console.error("Error en el registro:", err);
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-black tracking-tight text-unis-text">Crear cuenta</h1>
        <p className="mt-2 text-center text-sm text-unis-gray">
          Únete al Marketplace del Consultorio Empresarial Winner
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-lg border border-unis-lightgray bg-white px-4 py-8 shadow-sm sm:px-10">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-unis-text">
                Nombre completo / Razón social
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-md border border-unis-lightgray px-3 py-2 text-sm text-unis-text shadow-sm focus:border-unis-red focus:outline-none focus:ring-1 focus:ring-unis-red"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-unis-lightgray px-3 py-2 text-sm text-unis-text shadow-sm focus:border-unis-red focus:outline-none focus:ring-1 focus:ring-unis-red"
                />
              </div>
              <p className="mt-1 text-xs text-unis-gray">Mínimo 8 caracteres.</p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-unis-text">
                Tipo de cuenta
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full rounded-md border border-unis-lightgray px-3 py-2 text-sm text-unis-text shadow-sm focus:border-unis-red focus:outline-none focus:ring-1 focus:ring-unis-red"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-unis-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-center text-sm text-unis-gray">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-medium text-unis-red hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
