import "server-only";

/**
 * Sends email through Resend (resend.com, free tier). Without an API key,
 * emails are printed to the server log instead, so nothing breaks in dev.
 *
 * Until a domain is verified in Resend, the "from" address must be
 * onboarding@resend.dev and mail can only go to the Resend account's own
 * email address.
 */

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface Email {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

const from = () => process.env.EMAIL_FROM || "Melissa's Art <onboarding@resend.dev>";

/** Where order and form notifications for Melissa are sent. */
export const notificationEmail = () => process.env.NOTIFICATION_EMAIL || "";

export async function sendEmail(email: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info("[email:not-sent] RESEND_API_KEY not set", {
      to: email.to,
      subject: email.subject,
      text: email.text,
      attachments: email.attachments?.map((a) => a.filename),
    });
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: from(),
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      reply_to: email.replyTo,
      attachments: email.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
      })),
    }),
  });

  if (!res.ok) {
    console.error("[email] Resend error", res.status, await res.text());
    return false;
  }
  return true;
}

/** Plain "Label: value" lines for notification emails. */
export function fieldLines(fields: Record<string, string | undefined>): string {
  return Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}
