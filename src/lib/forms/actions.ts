"use server";

import { z } from "zod";
import { deliverSubmission, type Attachment } from "./deliver";
import type { FormState } from "./types";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

const email = z.string().trim().pipe(z.email("Please enter a valid email address."));
const name = z.string().trim().min(1, "Please enter your name.").max(120);
const message = (min: number) =>
  z.string().trim().min(min, "Please add a few more details.").max(5000);

function fieldsFrom(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) out[key] = value;
  }
  return out;
}

/** Hidden "website" field: humans leave it empty, spam bots fill it in. */
function isSpam(formData: FormData) {
  return Boolean(formData.get("website"));
}

function errorState(error: z.ZodError, values: Record<string, string>): FormState {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    errors[key] ??= issue.message;
  }
  return { status: "error", message: "Please check the highlighted fields.", errors, values };
}

const contactSchema = z.object({
  name,
  email,
  topic: z.enum(["general", "original", "order", "commission", "press"]),
  message: message(10),
});

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isSpam(formData)) return { status: "success" };
  const values = fieldsFrom(formData);
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return errorState(parsed.error, values);
  await deliverSubmission("contact", parsed.data);
  return { status: "success", message: "Thank you! Your message is on its way. Expect a reply within 2 business days." };
}

const inquirySchema = z.object({
  name,
  email,
  artwork: z.string().trim().min(1),
  country: z.string().trim().min(2, "Please tell us where the painting would ship to.").max(80),
  message: z.string().trim().max(5000).default(""),
});

export async function submitInquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isSpam(formData)) return { status: "success" };
  const values = fieldsFrom(formData);
  const parsed = inquirySchema.safeParse(values);
  if (!parsed.success) return errorState(parsed.error, values);
  await deliverSubmission("inquiry", parsed.data);
  return {
    status: "success",
    message: "Thanks for your interest! Melissa will get back to you personally with pricing and shipping details.",
  };
}

const commissionSchema = z.object({
  name,
  email,
  size: z.string().trim().min(1, "Please choose a size."),
  customSize: z.string().trim().max(60).default(""),
  subject: message(10),
  colors: z.string().trim().max(500).default(""),
  budget: z.string().trim().min(1, "Please choose a budget range."),
  deadline: z.string().trim().max(60).default(""),
  shipTo: z.string().trim().min(2, "Please tell us where it would ship to.").max(80),
  notes: z.string().trim().max(5000).default(""),
});

export async function submitCommission(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isSpam(formData)) return { status: "success" };
  const values = fieldsFrom(formData);
  const parsed = commissionSchema.safeParse(values);
  if (!parsed.success) return errorState(parsed.error, values);

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS) {
    return { status: "error", message: "Please check the highlighted fields.", values, errors: { photos: `Please attach up to ${MAX_PHOTOS} photos.` } };
  }
  for (const file of files) {
    if (!PHOTO_TYPES.includes(file.type)) {
      return { status: "error", message: "Please check the highlighted fields.", values, errors: { photos: `${file.name} isn't a supported image (JPG, PNG, WEBP or HEIC).` } };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return { status: "error", message: "Please check the highlighted fields.", values, errors: { photos: `${file.name} is larger than 5 MB.` } };
    }
  }

  const attachments: Attachment[] = await Promise.all(
    files.map(async (f) => ({
      filename: f.name,
      contentType: f.type,
      size: f.size,
      content: Buffer.from(await f.arrayBuffer()),
    })),
  );

  await deliverSubmission("commission", parsed.data, attachments);
  return {
    status: "success",
    message: "Your commission request has been sent! Melissa will reply within a few days to talk through ideas and a quote.",
  };
}

const newsletterSchema = z.object({ email });

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isSpam(formData)) return { status: "success" };
  const values = fieldsFrom(formData);
  const parsed = newsletterSchema.safeParse(values);
  if (!parsed.success) return errorState(parsed.error, values);
  await deliverSubmission("newsletter", parsed.data);
  return { status: "success", message: "You're on the list! 🎨" };
}
