import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { prisma } from "./prisma";
import { isSelfRegistrationRole } from "./roles";

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
    requireEmailVerification: false,
  },
  user: {
    // El modelo de Prisma se llama `users` y usa columnas en snake_case.
    modelName: "users",
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
    },
  },
});
