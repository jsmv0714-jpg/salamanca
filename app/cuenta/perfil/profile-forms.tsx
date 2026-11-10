"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { useHydrated } from "../../../lib/use-hydrated";
import { Field, FormError, FormNotice, inputClass, primaryButtonClass } from "../../../components/ui/form";

/** Mensaje en español para los errores más frecuentes de better-auth. */
function friendlyError(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  if (/invalid password|incorrect password/i.test(message)) return "La contraseña actual no es correcta.";
  if (/password too short/i.test(message)) return "La contraseña nueva debe tener al menos 8 caracteres.";
  if (/invalid email/i.test(message)) return "Escribe un correo electrónico válido.";
  if (/email is the same/i.test(message)) return "Ese ya es tu correo actual.";
  return fallback;
}

export function NameForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [name, setName] = useState(defaultName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");

    const value = name.trim();
    if (value.length < 2) {
      setError("Escribe tu nombre (al menos 2 caracteres).");
      return;
    }

    setPending(true);
    const { error: requestError } = await authClient.updateUser({ name: value });
    setPending(false);

    if (requestError) {
      setError(friendlyError(requestError.message, "No pudimos guardar el nombre. Inténtalo de nuevo."));
      return;
    }

    setName(value);
    setNotice("Nombre actualizado.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <FormNotice message={notice} />

      <Field label="Nombre" htmlFor="perfil-nombre" hint="Es el nombre que ven las empresas y el resto del ecosistema." required>
        <input
          id="perfil-nombre"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={200}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
      </Field>

      <button type="submit" disabled={pending || !hydrated} className={primaryButtonClass}>
        {pending ? "Guardando..." : "Guardar nombre"}
      </button>
    </form>
  );
}

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const hydrated = useHydrated();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");

    const value = email.trim().toLowerCase();
    if (value === currentEmail.toLowerCase()) {
      setError("Ese ya es tu correo actual.");
      return;
    }

    setPending(true);
    const { error: requestError } = await authClient.changeEmail({
      newEmail: value,
      callbackURL: "/cuenta/perfil?correo=enviado",
    });
    setPending(false);

    if (requestError) {
      setError(friendlyError(requestError.message, "No pudimos iniciar el cambio de correo. Inténtalo de nuevo."));
      return;
    }

    setEmail("");
    setNotice(
      `Te enviamos un enlace a ${currentEmail} para confirmar el cambio. Después tendrás que verificar la nueva dirección.`
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <FormNotice message={notice} />

      <Field
        label="Nuevo correo electrónico"
        htmlFor="perfil-correo"
        hint={`Tu correo actual es ${currentEmail}. Por seguridad, el cambio se confirma en dos pasos.`}
      >
        <input
          id="perfil-correo"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={150}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </Field>

      <button type="submit" disabled={pending || !hydrated} className={primaryButtonClass}>
        {pending ? "Enviando..." : "Cambiar correo"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const hydrated = useHydrated();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (newPassword.length < 8) {
      setError("La contraseña nueva debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setPending(true);
    const { error: requestError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    });
    setPending(false);

    if (requestError) {
      setError(friendlyError(requestError.message, "No pudimos cambiar la contraseña. Inténtalo de nuevo."));
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setNotice("Contraseña actualizada.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <FormNotice message={notice} />

      <Field label="Contraseña actual" htmlFor="perfil-clave-actual" required>
        <input
          id="perfil-clave-actual"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Contraseña nueva" htmlFor="perfil-clave-nueva" hint="Mínimo 8 caracteres." required>
        <input
          id="perfil-clave-nueva"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Repite la contraseña nueva" htmlFor="perfil-clave-confirmar" required>
        <input
          id="perfil-clave-confirmar"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className={inputClass}
        />
      </Field>

      <button type="submit" disabled={pending || !hydrated} className={primaryButtonClass}>
        {pending ? "Cambiando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
