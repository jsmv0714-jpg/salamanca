import { describe, expect, it } from "vitest";
import {
  REPORT_REASONS,
  REPORT_STATUSES,
  isReportReason,
  isReportStatus,
  removalReason,
} from "../lib/reports";

describe("reportes de abuso", () => {
  it("acepta solo motivos y estados conocidos", () => {
    for (const reason of REPORT_REASONS) expect(isReportReason(reason)).toBe(true);
    expect(isReportReason("virus")).toBe(false);
    expect(isReportReason(undefined)).toBe(false);

    for (const status of REPORT_STATUSES) expect(isReportStatus(status)).toBe(true);
    expect(isReportStatus("pending")).toBe(false);
    expect(isReportStatus(undefined)).toBe(false);
  });

  it("arma el motivo de retirada con la nota del administrador", () => {
    expect(removalReason("")).toBe("Retirada por un reporte de abuso.");
    expect(removalReason("Suplantación de identidad")).toBe(
      "Retirada por un reporte de abuso: Suplantación de identidad"
    );
  });

  it("recorta la nota para no superar el límite visible", () => {
    const reason = removalReason("x".repeat(600));
    expect(reason.length).toBeLessThanOrEqual(500);
    expect(reason.endsWith("...")).toBe(true);
  });
});
