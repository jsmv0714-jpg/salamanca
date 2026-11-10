"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import { Field, FormError, inputClass, primaryButtonClass } from "../../components/ui/form";
import { useHydrated } from "../../lib/use-hydrated";
import { authErrorMessage } from "../../lib/auth-errors";

function RestablecerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hydrated = useHydrated();

  if (!token) {
    return (
      <div className="space-y-4">
        <FormError message="El enlace no es válido o ya expiró. Solicita uno nuevo." />
        <Link
          href="/recuperar"
          className="block text-center text-sm font-medium text-unis-red hover:underline"
        >
          Solicitar otro enlace
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        setError(authErrorMessage(resetError, "No se pudo cambiar la contraseña. Solicita un enlace nuevo."));
        setLoading(false);
        return;
      }

      router.push("/login?restablecida=1");
      router.refresh();
    } catch (err) {
      console.error("Error al restablecer la contraseña:", err);
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormError message={error} />
      <Field label="Nueva contraseña" htmlFor="password" hint="Mínimo 8 caracteres." required>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Repite la contraseña" htmlFor="confirm" required>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className={inputClass}
        />
      </Field>
      <button type="submit" disabled={loading || !hydrated} className={`${primaryButtonClass} w-full`}>
        {loading ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}

export default function RestablecerPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-center text-2xl font-black tracking-tight text-unis-text">
        Nueva contraseña
      </h1>
      <p className="mt-2 text-center text-sm text-unis-gray">
        Elige una contraseña segura para volver a entrar a tu cuenta.
      </p>

      <div className="mt-8">
        <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-unis-bg" aria-busy="true" />}>
          <RestablecerForm />
        </Suspense>
      </div>
    </div>
  );
}
