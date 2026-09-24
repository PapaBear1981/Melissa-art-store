import "server-only";
import { loadSiteSettings } from "@/lib/content";
import { fieldLines, notificationEmail, sendEmail } from "@/lib/email";
import { getWriteClient } from "@/sanity/writeClient";

export type SubmissionKind = "contact" | "commission" | "inquiry" | "newsletter";

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

const subjects: Record<SubmissionKind, (f: Record<string, string>) => string> = {
  contact: (f) => `Website message from ${f.name} (${f.topic})`,
  inquiry: (f) => `Inquiry about “${f.artwork}” from ${f.name}`,
  commission: (f) => `Commission request from ${f.name}: ${f.size}`,
  newsletter: (f) => `New newsletter signup: ${f.email}`,
};

/** Saves a commission request to the dashboard, with its reference photos. */
async function saveCommission(fields: Record<string, string>, attachments: Attachment[]) {
  const write = getWriteClient();
  if (!write) return;
  const photos = await Promise.all(
    attachments.map(async (a, i) => {
      const asset = await write.assets.upload("image", a.content, { filename: a.filename, contentType: a.contentType });
      return { _key: `photo${i}`, _type: "image", asset: { _type: "reference", _ref: asset._id } };
    }),
  );
  await write.create({
    _type: "commissionRequest",
    status: "new",
    receivedAt: new Date().toISOString(),
    name: fields.name,
    email: fields.email,
    size: fields.size,
    customSize: fields.customSize,
    subject: fields.subject,
    colors: fields.colors,
    budget: fields.budget,
    deadline: fields.deadline,
    shipTo: fields.shipTo,
    customerNotes: fields.notes,
    photos,
  });
}

/**
 * Delivers a form submission to Melissa by email (reply goes straight to
 * the sender). Commission requests are also saved on the dashboard.
 */
export async function deliverSubmission(
  kind: SubmissionKind,
  fields: Record<string, string>,
  attachments: Attachment[] = [],
): Promise<void> {
  if (kind === "commission") {
    try {
      await saveCommission(fields, attachments);
    } catch (err) {
      // Still send the email even if saving fails.
      console.error("[forms] could not save commission request", err);
    }
  }

  const settings = await loadSiteSettings();
  await sendEmail({
    to: notificationEmail() || settings.email,
    replyTo: fields.email,
    subject: subjects[kind](fields),
    text: fieldLines(fields),
    attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })),
  });
}
