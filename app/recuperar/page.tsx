"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { Field, FormError, FormNotice, inputClass, primaryButtonClass } from "../../components/ui/form";
import { authErrorMessage } from "../../lib/auth-errors";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/restablecer`,
      });

      if (resetError) {
        setError(authErrorMessage(resetError, "No se pudo procesar la solicitud. Intenta de nuevo."));
        setLoading(false);
        return;
      }

      // Mensaje genérico: no se revela si el correo está registrado o no.
      setSent(true);
    } catch (err) {
      console.error("Error al solicitar el restablecimiento:", err);
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-center text-2xl font-black tracking-tight text-unis-text">
        Recuperar contraseña
      </h1>
      <p className="mt-2 text-center text-sm text-unis-gray">
        Escribe el correo con el que te registraste y te enviaremos un enlace para crear una
        contraseña nueva.
      </p>

      <div className="mt-8 space-y-4">
        {sent ? (
          <>
            <FormNotice message="Si el correo está registrado, recibirás un enlace en los próximos minutos. Revisa también la carpeta de spam." />
            <Link
              href="/login"
              className="block text-center text-sm font-medium text-unis-red hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormError message={error} />
            <Field label="Correo electrónico" htmlFor="email" required>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </Field>
            <button type="submit" disabled={loading} className={`${primaryButtonClass} w-full`}>
              {loading ? "Enviando…" : "Enviar enlace"}
            </button>
            <Link
              href="/login"
              className="block text-center text-sm font-medium text-unis-red hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
