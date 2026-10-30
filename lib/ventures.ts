/**
 * Constantes y reglas del modelo Winner para ventures (spin-offs y startups)
 * y para el directorio del ecosistema.
 */

export const VENTURE_TYPES = ["spin_off", "startup"] as const;
export type VentureType = (typeof VENTURE_TYPES)[number];

export function isVentureType(value: unknown): value is VentureType {
  return typeof value === "string" && (VENTURE_TYPES as readonly string[]).includes(value);
}

export const VENTURE_TYPE_LABELS: Record<VentureType, string> = {
  spin_off: "Spin-off",
  startup: "Startup",
};

export const VENTURE_TYPE_HELP: Record<VentureType, string> = {
  spin_off:
    "Nace de conocimiento o propiedad intelectual de un grupo de investigación de la institución.",
  startup:
    "Formaliza una iniciativa emprendedora interna o de un beneficiario del ecosistema.",
};

export const BUSINESS_MODELS = ["b2b", "b2c", "both"] as const;
export type BusinessModel = (typeof BUSINESS_MODELS)[number];

export function isBusinessModel(value: unknown): value is BusinessModel {
  return typeof value === "string" && (BUSINESS_MODELS as readonly string[]).includes(value);
}

export const BUSINESS_MODEL_LABELS: Record<BusinessModel, string> = {
  b2b: "B2B",
  b2c: "B2C",
  both: "B2B y B2C",
};

export const VENTURE_STATUSES = ["draft", "in_review", "published", "rejected"] as const;
export type VentureStatus = (typeof VENTURE_STATUSES)[number];

export function isVentureStatus(value: unknown): value is VentureStatus {
  return typeof value === "string" && (VENTURE_STATUSES as readonly string[]).includes(value);
}

export const VENTURE_STATUS_LABELS: Record<VentureStatus, string> = {
  draft: "Borrador",
  in_review: "En revisión",
  published: "Publicada",
  rejected: "Rechazada",
};

/** Fases de madurez según la escala TRL del modelo Winner. */
export const TRL_PHASES = [
  { key: "base", label: "Base", min: 1, max: 3, description: "Observación e investigación básica" },
  { key: "validacion", label: "Validación", min: 4, max: 6, description: "Desarrollo tecnológico y pruebas" },
  { key: "operativa", label: "Operativa", min: 7, max: 9, description: "Despliegue en el entorno productivo real" },
] as const;

export function trlPhase(level: number) {
  return TRL_PHASES.find((p) => level >= p.min && level <= p.max) ?? TRL_PHASES[0];
}

/** Las 6 etapas del servicio del consultorio Winner. */
export const SERVICE_STAGES = [
  "Entendimiento",
  "Diagnóstico",
  "Acompañamiento técnico",
  "Plan de mejora",
  "Implementación",
  "Seguimiento",
] as const;

/**
 * Qué tipo de venture puede crear cada rol:
 * - los docentes (consultores senior) crean spin-offs, que nacen de grupos de investigación;
 * - los emprendedores y estudiantes crean startups;
 * - el administrador puede crear ambos.
 */
export function allowedVentureTypes(role: string): VentureType[] {
  switch (role) {
    case "admin":
      return ["spin_off", "startup"];
    case "teacher":
      return ["spin_off"];
    case "entrepreneur":
    case "student":
      return ["startup"];
    default:
      return [];
  }
}

/** Roles que pueden aparecer en el directorio. Los estudiantes no se listan públicamente. */
export const DIRECTORY_ROLES = ["company", "association", "entrepreneur", "teacher"] as const;
export type DirectoryRole = (typeof DIRECTORY_ROLES)[number];

export function isDirectoryRole(value: unknown): value is DirectoryRole {
  return typeof value === "string" && (DIRECTORY_ROLES as readonly string[]).includes(value);
}

export const DIRECTORY_ROLE_LABELS: Record<DirectoryRole, string> = {
  company: "Empresa / PyME",
  association: "Agremiación",
  entrepreneur: "Emprendedor",
  teacher: "Consultor senior",
};

export const DIRECTORY_ROLE_PLURALS: Record<DirectoryRole, string> = {
  company: "Empresas y PyMEs",
  association: "Agremiaciones",
  entrepreneur: "Emprendedores",
  teacher: "Consultores senior",
};

export const ALLIANCE_LABELS: Record<string, string> = {
  intention: "Alianza de intención",
  active: "Alianza activa",
};
