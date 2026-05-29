import nodemailer from "nodemailer";

const SUPPORT_EMAIL = process.env.CONTACT_TO_EMAIL || "support@anshapps.com";

function env(key: string): string | undefined {
  const raw = process.env[key]?.trim();
  if (!raw) return undefined;
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  return raw;
}

export function isSmtpConfigured(): boolean {
  return Boolean(env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS"));
}

function createTransporter() {
  const port = parseInt(env("SMTP_PORT") || "465", 10);
  const secureFlag = env("SMTP_SECURE");
  const secure =
    secureFlag === "true" || (secureFlag !== "false" && port === 465);

  return nodemailer.createTransport({
    host: env("SMTP_HOST"),
    port,
    secure,
    auth: {
      user: env("SMTP_USER"),
      pass: env("SMTP_PASS"),
    },
    tls: {
      minVersion: "TLSv1.2",
    },
    ...(port === 587 && !secure ? { requireTLS: true } : {}),
  });
}

export async function sendContactEmailViaSmtp(
  name: string,
  fromEmail: string,
  subject: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSmtpConfigured()) {
    return { ok: false, error: "SMTP not configured" };
  }

  // Hostinger: authenticate with primary mailbox (hello@). Alias (support@) as From only if enabled in panel.
  const smtpUser = env("SMTP_USER")!;
  const fromAddress = env("SMTP_FROM") || smtpUser;

  const transporter = createTransporter();

  const mail = {
    from: `"ANSH Task" <${fromAddress}>`,
    to: SUPPORT_EMAIL,
    replyTo: `"${name}" <${fromEmail}>`,
    subject: `[Contact] ${subject}`,
    text: [
      "New contact form message",
      "",
      `Name: ${name}`,
      `Email: ${fromEmail}`,
      `Topic: ${subject}`,
      "",
      "Message:",
      message,
    ].join("\n"),
    html: [
      `<p><strong>New contact form message</strong></p>`,
      `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
      `<p><strong>Email:</strong> ${escapeHtml(fromEmail)}</p>`,
      `<p><strong>Topic:</strong> ${escapeHtml(subject)}</p>`,
      `<p><strong>Message:</strong></p>`,
      `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    ].join("\n"),
  };

  try {
    await transporter.verify();

    try {
      await transporter.sendMail(mail);
      return { ok: true };
    } catch (firstErr: unknown) {
      // If alias From fails, retry using authenticated mailbox address
      if (fromAddress.toLowerCase() !== smtpUser.toLowerCase()) {
        console.warn("SMTP: retry send using SMTP_USER as From address");
        await transporter.sendMail({ ...mail, from: `"ANSH Task" <${smtpUser}>` });
        return { ok: true };
      }
      throw firstErr;
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "SMTP send failed";
    console.error("SMTP contact email error:", errorMessage);
    return { ok: false, error: errorMessage };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
