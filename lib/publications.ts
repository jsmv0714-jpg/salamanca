/** Constantes y reglas de publicaciones y postulaciones. */

export const PUBLICATION_STATUSES = ["draft", "in_review", "published", "closed", "rejected"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export function isPublicationStatus(value: unknown): value is PublicationStatus {
  return typeof value === "string" && (PUBLICATION_STATUSES as readonly string[]).includes(value);
}

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  draft: "Borrador",
  in_review: "En revisión",
  published: "Publicada",
  closed: "Cerrada",
  rejected: "Rechazada",
};

export const PUBLICATION_TYPE_CODES = ["internship", "b2b_offer", "b2b_request"] as const;
export type PublicationTypeCode = (typeof PUBLICATION_TYPE_CODES)[number];

export function isPublicationTypeCode(value: unknown): value is PublicationTypeCode {
  return typeof value === "string" && (PUBLICATION_TYPE_CODES as readonly string[]).includes(value);
}

export const MODALITIES = ["presential", "remote", "hybrid"] as const;
export type Modality = (typeof MODALITIES)[number];

/** Tamaño de página del listado público de publicaciones. */
export const PUBLICATIONS_PAGE_SIZE = 9;

export function isModality(value: unknown): value is Modality {
  return typeof value === "string" && (MODALITIES as readonly string[]).includes(value);
}

export const MODALITY_LABELS: Record<Modality, string> = {
  presential: "Presencial",
  remote: "Remoto",
  hybrid: "Híbrido",
};

export const APPLICATION_STATUSES = [
  "sent",
  "viewed",
  "shortlisted",
  "accepted",
  "rejected",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && (APPLICATION_STATUSES as readonly string[]).includes(value);
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  sent: "Enviada",
  viewed: "Vista",
  shortlisted: "Preseleccionada",
  accepted: "Aceptada",
  rejected: "No seleccionada",
  withdrawn: "Retirada",
};

/** Quien retiró su postulación puede volver a enviarla una sola vez (`reapplied_at` queda fijado al hacerlo). */
export function canReapply(application: { status: string; reapplied_at: Date | null }): boolean {
  return application.status === "withdrawn" && application.reapplied_at === null;
}

/** Estados que quien publica puede asignar a una postulación. */
export const REVIEWER_APPLICATION_STATUSES = ["viewed", "shortlisted", "accepted", "rejected"] as const;

/** Roles que pueden publicar ofertas (un subconjunto del enum author_type). */
export const AUTHOR_ROLES = ["company", "entrepreneur"] as const;
export type AuthorRole = (typeof AUTHOR_ROLES)[number];

export function isAuthorRole(value: unknown): value is AuthorRole {
  return typeof value === "string" && (AUTHOR_ROLES as readonly string[]).includes(value);
}

/**
 * Quién puede postularse:
 * - a las prácticas, los estudiantes;
 * - a las ofertas y solicitudes B2B, empresas, agremiaciones, emprendedores y docentes.
 */
export function canApplyToType(typeCode: string, role: string): boolean {
  if (typeCode === "internship") return role === "student";
  return role === "company" || role === "association" || role === "entrepreneur" || role === "teacher";
}

export function whoCanApply(typeCode: string): string {
  return typeCode === "internship"
    ? "Solo los estudiantes pueden postularse a las prácticas."
    : "Pueden responder las empresas, agremiaciones, emprendedores y consultores senior.";
}

export const APPLY_COPY: Record<string, { title: string; button: string; message: string; hint: string }> = {
  internship: {
    title: "Postularme a esta práctica",
    button: "Enviar postulación",
    message: "¿Por qué te interesa esta práctica?",
    hint: "Cuéntale a la empresa qué te motiva y qué puedes aportar.",
  },
  b2b_offer: {
    title: "Estoy interesado en este servicio",
    button: "Enviar solicitud",
    message: "¿Qué necesitas o qué te interesa?",
    hint: "Describe tu necesidad para que quien ofrece el servicio pueda responderte.",
  },
  b2b_request: {
    title: "Puedo ayudar con esta solicitud",
    button: "Enviar propuesta",
    message: "¿Cómo puedes ayudar?",
    hint: "Explica brevemente tu experiencia y cómo resolverías la necesidad.",
  },
};

export function applyCopy(typeCode: string) {
  return APPLY_COPY[typeCode] ?? APPLY_COPY.b2b_offer;
}

/** Rutas que no pueden usarse como slug porque ya tienen una página propia. */
export const RESERVED_SLUGS = ["nueva"];
