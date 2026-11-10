import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { prisma } from "./prisma";
import { isSelfRegistrationRole } from "./roles";
import { stripProtectedUserFields } from "./auth-guards";
import { appUrl, sendEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Los ids los genera la base de datos (users.id es UUID con gen_random_uuid()).
  advanced: {
    database: {
      generateId: false,
    },
  },
  emailAndPassword: {
    enabled: true,
    // Las cuentas existentes se marcaron como verificadas en la migración
    // `mark_existing_users_verified`; las nuevas deben confirmar su correo.
    requireEmailVerification: true,
    // Enlace de recuperación de contraseña (vence en 1 hora).
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Restablece tu contraseña | Unisalamanca Marketplace",
        text: [
          `Hola${user.name ? ` ${user.name}` : ""},`,
          "",
          "Recibimos una solicitud para restablecer tu contraseña.",
          `Abre este enlace para crear una nueva: ${url}`,
          "",
          "Si no lo solicitaste, ignora este correo; tu contraseña no cambiará.",
          "",
          `— ${appUrl()}`,
        ].join("\n"),
      });
    },
  },
  // Límite de intentos por IP: frena la fuerza bruta al login y el spam de correos.
  rateLimit: {
    enabled: true,
    // Contadores en la base de datos: sobreviven a reinicios y se comparten entre instancias.
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      // Límite por IP: en un campus muchas personas comparten IP, así que el umbral es amplio.
      "/sign-in/email": { window: 900, max: 20 },
      "/request-password-reset": { window: 900, max: 3 },
      "/sign-up/email": { window: 3600, max: 10 },
      "/send-verification-email": { window: 900, max: 3 },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Confirma tu correo | Unisalamanca Marketplace",
        text: [
          `Hola${user.name ? ` ${user.name}` : ""},`,
          "",
          "Confirma tu correo para completar tu registro:",
          url,
          "",
          `— ${appUrl()}`,
        ].join("\n"),
      });
    },
  },
  user: {
    // El modelo de Prisma se llama `users` y usa columnas en snake_case.
    modelName: "users",
    // Cambio de correo en dos pasos: se confirma desde la dirección actual y
    // luego se verifica la nueva. Así nadie cambia el correo de otra persona.
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Confirma el cambio de correo | Unisalamanca Marketplace",
          text: [
            `Hola${user.name ? ` ${user.name}` : ""},`,
            "",
            `Pediste cambiar el correo de tu cuenta a ${newEmail}.`,
            `Confirma el cambio aquí: ${url}`,
            "",
            "Si no lo solicitaste, ignora este correo; tu dirección actual seguirá igual.",
            "",
            `— ${appUrl()}`,
          ].join("\n"),
        });
      },
    },
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: true,
      },
      // Estado de la cuenta (user_status). Solo lectura: el cliente no puede enviarlo.
      status: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // `role` llega desde el formulario público: se rechaza cualquier valor
        // que no sea un rol de auto-registro (en especial `admin`).
        before: async (user) => {
          const role = (user as { role?: unknown }).role;
          if (!isSelfRegistrationRole(role)) {
            throw new APIError("BAD_REQUEST", {
              message: "Rol no permitido para el registro",
            });
          }
        },
      },
      update: {
        // `/api/auth/update-user` acepta cualquier campo adicional con `input: true`.
        // Aquí se descartan `role` y `status` para que nadie pueda ascenderse a
        // administrador ni reactivar su propia cuenta desde el cliente.
        before: async (data) => {
          const rest = stripProtectedUserFields(data as Record<string, unknown>);
          return { data: rest as typeof data };
        },
      },
    },
  },
});
