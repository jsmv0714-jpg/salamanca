/**
 * Roles que una persona puede elegir al registrarse por su cuenta.
 * El rol `admin` NO está aquí a propósito: solo se asigna directamente en la base de datos.
 */
export const SELF_REGISTRATION_ROLES = [
  "student",
  "company",
  "association",
  "entrepreneur",
  "teacher",
] as const;

export type SelfRegistrationRole = (typeof SELF_REGISTRATION_ROLES)[number];

export function isSelfRegistrationRole(value: unknown): value is SelfRegistrationRole {
  return (
    typeof value === "string" &&
    (SELF_REGISTRATION_ROLES as readonly string[]).includes(value)
  );
}
