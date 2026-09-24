import "server-only";

export type SubmissionKind = "contact" | "commission" | "inquiry" | "newsletter";

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

/**
 * Delivers a form submission to the artist.
 *
 * TODO (email phase): send via Resend and save commission requests to the
 * content dashboard. For now submissions are logged on the server.
 */
export async function deliverSubmission(
  kind: SubmissionKind,
  fields: Record<string, string>,
  attachments: Attachment[] = [],
): Promise<void> {
  console.info(`[form:${kind}]`, {
    ...fields,
    attachments: attachments.map((a) => `${a.filename} (${a.contentType}, ${a.size} bytes)`),
  });
}
