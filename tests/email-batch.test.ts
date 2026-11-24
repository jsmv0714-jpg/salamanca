import { afterEach, describe, expect, it, vi } from "vitest";
import { sendBatchEmails } from "../lib/email";

const messages = [
  { to: "ana@example.com", subject: "Nueva noticia", text: "Hola" },
  { to: "luis@example.com", subject: "Nueva noticia", text: "Hola" },
];

describe("envío de correos por lotes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.EMAIL_FROM;
  });

  it("si un lote se rechaza, reenvía uno por uno y solo cuenta como fallido el destinatario malo", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("invalid", { status: 422 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("bad", { status: 422 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendBatchEmails(messages);

    expect(result).toEqual({ sent: 1, failed: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/emails/batch");
    expect(String(fetchMock.mock.calls[1][0])).toBe("https://api.resend.com/emails");
  }, 10000);

  it("sin proveedor configurado no envía nada y lo informa en consola", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await sendBatchEmails(messages);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.sent).toBe(messages.length);
  });
});
