import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

// Hace que el cliente conozca los campos extra definidos en lib/auth.ts (ej. `role`).
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
