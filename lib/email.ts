/**
 * Envío de correos transaccionales.
 *
 * Si `RESEND_API_KEY` está configurada se usa Resend; si no, el correo se
 * registra en el servidor para poder probar los flujos en desarrollo sin
 * depender de un proveedor externo.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const DEFAULT_FROM = "Unisalamanca Marketplace <no-reply@unisalamanca.edu.co>";

/** URL pública de la aplicación, sin barra final. */
export function appUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  if (!apiKey) {
    console.info(`[email] Sin proveedor configurado. Para: ${message.to} | ${message.subject}`);
    if (process.env.NODE_ENV !== "production") console.info(message.text);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`El proveedor de correo respondió ${response.status}`);
  }
}
