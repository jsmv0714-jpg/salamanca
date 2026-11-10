/** Motivos y estados de los reportes de abuso, compartidos por el formulario y el panel. */

export const REPORT_REASONS = ["spam", "scam", "inappropriate", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam o publicidad engañosa",
  scam: "Posible estafa o fraude",
  inappropriate: "Contenido inapropiado u ofensivo",
  other: "Otro motivo",
};

export function isReportReason(value: string | undefined): value is ReportReason {
  return typeof value === "string" && (REPORT_REASONS as readonly string[]).includes(value);
}

export const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Abiertos",
  resolved: "Resueltos",
  dismissed: "Descartados",
};

export function isReportStatus(value: string | undefined): value is ReportStatus {
  return typeof value === "string" && (REPORT_STATUSES as readonly string[]).includes(value);
}

/** Motivo de rechazo que verá quien publicó cuando se retira por un reporte. */
export function removalReason(note: string): string {
  const base = "Retirada por un reporte de abuso";
  const text = note ? `${base}: ${note}` : `${base}.`;
  return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}
