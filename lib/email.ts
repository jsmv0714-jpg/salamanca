/**
 * Envío de correos transaccionales.
 *
 * Prioridad: SMTP (por ejemplo Gmail), después Resend y, si no hay ningún
 * proveedor configurado, consola para poder probar los flujos en desarrollo.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
};

const DEFAULT_FROM = "Unisalamanca Marketplace <no-reply@unisalamanca.edu.co>";
const PLACEHOLDER = /^(?:$|<.*>|PEGAR.*|RELLENAR.*|PENDIENTE.*|CAMBIAR.*|TU_.*)$/i;

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function smtpSettings(): SmtpSettings | null {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const rawPassword = env("SMTP_PASSWORD");

  if (!host || !user || PLACEHOLDER.test(rawPassword)) return null;

  // Gmail muestra la contraseña de aplicación en grupos de 4 caracteres; los
  // espacios son solo de presentación y pueden venir en el copiado/pegado.
  const password = host.toLowerCase().includes("gmail")
    ? rawPassword.replace(/\s+/g, "")
    : rawPassword;
  if (!password) return null;

  const secure = /^(1|true|yes|on)$/i.test(env("SMTP_SECURE"));
  const portValue = env("SMTP_PORT");
  const port = portValue ? Number(portValue) : secure ? 465 : 587;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("SMTP_PORT no es un puerto válido");
  }

  return { host, port, secure, user, password };
}

/** Remitente a usar. Gmail solo permite enviar como el usuario autenticado. */
function senderFor(smtp?: SmtpSettings): string {
  const configured = env("EMAIL_FROM") || DEFAULT_FROM;
  if (!smtp || !smtp.host.toLowerCase().includes("gmail.com")) return configured;

  const gmailDomain = smtp.user.split("@")[1]?.toLowerCase();
  const current = configured.match(/<([^>]+)>/)?.[1]?.toLowerCase() ?? configured.toLowerCase();
  if (gmailDomain && !current.endsWith(`@${gmailDomain}`)) {
    console.warn(`[email] Gmail SMTP exige EMAIL_FROM con ${smtp.user}; se ajusta el remitente.`);
    return `Unisalamanca Marketplace <${smtp.user}>`;
  }
  return configured;
}

async function sendViaSmtp(settings: SmtpSettings, message: EmailMessage): Promise<void> {
  const { createTransport } = await import("nodemailer");
  const transporter = createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    requireTLS: !settings.secure,
    auth: { user: settings.user, pass: settings.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" },
  });

  await transporter.sendMail({
    from: senderFor(settings),
    to: message.to,
    subject: message.subject,
    text: message.text,
    ...(message.html ? { html: message.html } : {}),
  });
}

/** URL pública de la aplicación, sin barra final. */
export function appUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const smtp = smtpSettings();
  if (smtp) {
    await sendViaSmtp(smtp, message);
    return;
  }

  const apiKey = env("RESEND_API_KEY");
  const from = senderFor();

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
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`El proveedor de correo respondió ${response.status}${detail ? `: ${detail}` : ""}`);
  }
}

/** Resend admite hasta 100 correos por petición al endpoint de lotes. */
const BATCH_SIZE = 100;
/** Pausa entre correos/lotes para no superar los límites de los planes gratuitos. */
const BATCH_PAUSE_MS = 600;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Envía varios correos individuales (cada persona recibe solo el suyo).
 * Nunca lanza: devuelve cuántos salieron y cuántos fallaron.
 */
export async function sendBatchEmails(messages: EmailMessage[]): Promise<{ sent: number; failed: number }> {
  if (messages.length === 0) return { sent: 0, failed: 0 };

  const smtp = smtpSettings();
  if (smtp) {
    // SMTP no tiene endpoint de lotes: se envía uno por uno y se aísla el fallo.
    let sent = 0;
    let failed = 0;
    for (let index = 0; index < messages.length; index += 1) {
      try {
        await sendEmail(messages[index]);
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error(`[email] No se pudo enviar a ${messages[index].to}:`, error);
      }
      if (index < messages.length - 1) await pause(BATCH_PAUSE_MS);
    }
    return { sent, failed };
  }

  const apiKey = env("RESEND_API_KEY");
  const from = senderFor();

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
          await pause(BATCH_PAUSE_MS);
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
      await pause(BATCH_PAUSE_MS);
    }
  }

  return { sent, failed };
}
