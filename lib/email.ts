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

/** Resend admite hasta 100 correos por petición al endpoint de lotes. */
const BATCH_SIZE = 100;
/** Pausa entre lotes para no superar el límite de peticiones por segundo del plan gratuito. */
const BATCH_PAUSE_MS = 600;

/**
 * Envía varios correos individuales (cada persona recibe solo el suyo) en lotes.
 * Nunca lanza: devuelve cuántos salieron y cuántos fallaron.
 */
export async function sendBatchEmails(messages: EmailMessage[]): Promise<{ sent: number; failed: number }> {
  if (messages.length === 0) return { sent: 0, failed: 0 };

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  if (!apiKey) {
    console.info(`[email] Sin proveedor configurado. ${messages.length} correos registrados en consola (${messages[0].subject}).`);
    return { sent: messages.length, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  for (let start = 0; start < messages.length; start += BATCH_SIZE) {
    const chunk = messages.slice(start, start + BATCH_SIZE);
    try {
      const response = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          chunk.map((message) => ({
            from,
            to: [message.to],
            subject: message.subject,
            text: message.text,
            ...(message.html ? { html: message.html } : {}),
          }))
        ),
      });

      if (response.ok) {
        sent += chunk.length;
      } else if (response.status === 422) {
        // Un solo destinatario inválido invalida el lote completo: se reenvía uno por uno
        // para que el error afecte solo a esa dirección.
        for (const message of chunk) {
          try {
            await sendEmail(message);
            sent += 1;
          } catch (error) {
            failed += 1;
            console.error(`[email] No se pudo enviar a un destinatario:`, error);
          }
          await new Promise((resolve) => setTimeout(resolve, BATCH_PAUSE_MS));
        }
      } else {
        failed += chunk.length;
        console.error(`[email] El lote de correos falló con ${response.status}: ${(await response.text()).slice(0, 300)}`);
      }
    } catch (error) {
      failed += chunk.length;
      console.error("[email] No se pudo enviar un lote de correos:", error);
    }

    if (start + BATCH_SIZE < messages.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_PAUSE_MS));
    }
  }

  return { sent, failed };
}
