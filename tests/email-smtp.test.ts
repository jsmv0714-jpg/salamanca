import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("nodemailer", () => {
  const sendMail = vi.fn();
  const createTransport = vi.fn(() => ({ sendMail }));
  return { createTransport, __sendMail: sendMail, __createTransport: createTransport };
});

import * as nodemailer from "nodemailer";
import { sendBatchEmails, sendEmail } from "../lib/email";

const mocked = nodemailer as unknown as {
  __sendMail: Mock;
  __createTransport: Mock;
};

const message = {
  to: "ana@example.com",
  subject: "Confirma tu cuenta",
  text: "Hola Ana",
};

function smtpEnv() {
  process.env.SMTP_HOST = "smtp.gmail.com";
  process.env.SMTP_PORT = "587";
  process.env.SMTP_SECURE = "false";
  process.env.SMTP_USER = "jsmv0714@gmail.com";
  process.env.SMTP_PASSWORD = "abcd abcd abcd abcd";
  process.env.EMAIL_FROM = "Unisalamanca Marketplace <onboarding@resend.dev>";
  delete process.env.RESEND_API_KEY;
}

describe("envío de correos por SMTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.__sendMail.mockResolvedValue({ messageId: "test" });
    smtpEnv();
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    delete process.env.EMAIL_FROM;
    delete process.env.RESEND_API_KEY;
  });

  it("usa SMTP antes que Resend, quita los espacios de la contraseña de Gmail y ajusta el remitente", async () => {
    await sendEmail(message);

    expect(mocked.__createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: "jsmv0714@gmail.com", pass: "abcdabcdabcdabcd" },
      })
    );
    expect(mocked.__sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Unisalamanca Marketplace <jsmv0714@gmail.com>",
        to: message.to,
      })
    );
  });

  it("envía los lotes uno por uno y solo cuenta como fallido el correo que falló", async () => {
    mocked.__sendMail.mockRejectedValueOnce(new Error("SMTP caído"));
    const messages = [message, { ...message, to: "luis@example.com" }];

    const result = await sendBatchEmails(messages);

    expect(result).toEqual({ sent: 1, failed: 1 });
    expect(mocked.__sendMail).toHaveBeenCalledTimes(2);
  });
});
