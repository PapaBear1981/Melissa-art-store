import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitCommission, submitContact, submitInquiry, subscribeNewsletter } from "./actions";
import { initialFormState } from "./types";

const { deliverSubmission } = vi.hoisted(() => ({ deliverSubmission: vi.fn() }));
vi.mock("./deliver", () => ({ deliverSubmission }));

beforeEach(() => {
  deliverSubmission.mockReset().mockResolvedValue(undefined);
});

function form(fields: Record<string, string>, files: File[] = []) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  for (const f of files) fd.append("photos", f);
  return fd;
}

const invalid = "Please check the highlighted fields.";

describe("submitContact", () => {
  const valid = { name: "  Ann  ", email: " ann@b.test ", topic: "order", message: "Where is my order please?" };

  it("delivers trimmed fields and thanks the sender", async () => {
    const state = await submitContact(initialFormState, form(valid));
    expect(state).toEqual({
      status: "success",
      message: "Thank you! Your message is on its way. Expect a reply within 2 business days.",
    });
    expect(deliverSubmission).toHaveBeenCalledWith("contact", {
      name: "Ann",
      email: "ann@b.test",
      topic: "order",
      message: "Where is my order please?",
    });
  });

  it("pretends to succeed for bots that fill the hidden website field", async () => {
    const state = await submitContact(initialFormState, form({ ...valid, website: "spam.example" }));
    expect(state).toEqual({ status: "success" });
    expect(deliverSubmission).not.toHaveBeenCalled();
  });

  it("returns one message per invalid field and echoes the values back", async () => {
    const values = { name: " ", email: "not-an-email", topic: "other", message: "short" };
    const state = await submitContact(initialFormState, form(values));
    expect(state).toEqual({
      status: "error",
      message: invalid,
      values,
      errors: {
        name: "Please enter your name.",
        email: "Please enter a valid email address.",
        topic: expect.any(String),
        message: "Please add a few more details.",
      },
    });
    expect(deliverSubmission).not.toHaveBeenCalled();
  });

  it("drops Next.js internal $-prefixed fields from the values", async () => {
    const fd = form({ ...valid, $ACTION_ID_abc: "x", "$ACTION_REF_1": "" });
    fd.set("message", "short");
    const state = await submitContact(initialFormState, fd);
    expect(state.values).toEqual({ ...valid, message: "short" });
  });

  it("reports missing fields", async () => {
    const state = await submitContact(initialFormState, form({}));
    expect(Object.keys(state.errors ?? {}).sort()).toEqual(["email", "message", "name", "topic"]);
  });
});

describe("submitInquiry", () => {
  it("defaults the optional message to an empty string", async () => {
    const state = await submitInquiry(
      initialFormState,
      form({ name: "Bo", email: "bo@b.test", artwork: "tidewater", country: "Canada" }),
    );
    expect(state).toEqual({
      status: "success",
      message: "Thanks for your interest! Melissa will get back to you personally with pricing and shipping details.",
    });
    expect(deliverSubmission).toHaveBeenCalledWith("inquiry", {
      name: "Bo",
      email: "bo@b.test",
      artwork: "tidewater",
      country: "Canada",
      message: "",
    });
  });

  it("asks where the painting would ship to", async () => {
    const state = await submitInquiry(
      initialFormState,
      form({ name: "Bo", email: "bo@b.test", artwork: "tidewater", country: "U" }),
    );
    expect(state.status).toBe("error");
    expect(state.errors).toEqual({ country: "Please tell us where the painting would ship to." });
  });

  it("ignores spam", async () => {
    expect(await submitInquiry(initialFormState, form({ website: "x" }))).toEqual({ status: "success" });
    expect(deliverSubmission).not.toHaveBeenCalled();
  });
});

describe("submitCommission", () => {
  const valid = {
    name: "Cy",
    email: "cy@b.test",
    size: "24x36",
    subject: "Our house by the lake",
    budget: "1000-2000",
    shipTo: "USA",
  };
  const jpeg = (name = "ref.jpg", bytes = 4) => new File([new Uint8Array(bytes).fill(7)], name, { type: "image/jpeg" });

  it("fills in optional fields and delivers photos as attachments", async () => {
    const png = new File(["png!"], "b.png", { type: "image/png" });
    const state = await submitCommission(initialFormState, form(valid, [jpeg(), png]));

    expect(state).toEqual({
      status: "success",
      message: "Your commission request has been sent! Melissa will reply within a few days to talk through ideas and a quote.",
    });
    expect(deliverSubmission).toHaveBeenCalledWith(
      "commission",
      { ...valid, customSize: "", colors: "", deadline: "", notes: "" },
      [
        { filename: "ref.jpg", contentType: "image/jpeg", size: 4, content: Buffer.from([7, 7, 7, 7]) },
        { filename: "b.png", contentType: "image/png", size: 4, content: Buffer.from("png!") },
      ],
    );
  });

  it("ignores empty file inputs", async () => {
    const empty = new File([], "", { type: "application/octet-stream" });
    await submitCommission(initialFormState, form(valid, [empty]));
    expect(deliverSubmission).toHaveBeenCalledWith("commission", expect.any(Object), []);
  });

  it("rejects more than five photos", async () => {
    const files = Array.from({ length: 6 }, (_, i) => jpeg(`p${i}.jpg`));
    const state = await submitCommission(initialFormState, form(valid, files));
    expect(state).toEqual({ status: "error", message: invalid, values: valid, errors: { photos: "Please attach up to 5 photos." } });
    expect(deliverSubmission).not.toHaveBeenCalled();
  });

  it("rejects files that aren't supported images", async () => {
    const pdf = new File(["%PDF"], "plan.pdf", { type: "application/pdf" });
    const state = await submitCommission(initialFormState, form(valid, [jpeg(), pdf]));
    expect(state.errors).toEqual({ photos: "plan.pdf isn't a supported image (JPG, PNG, WEBP or HEIC)." });
    expect(deliverSubmission).not.toHaveBeenCalled();
  });

  it("rejects photos larger than 5 MB", async () => {
    const big = jpeg("huge.jpg", 5 * 1024 * 1024 + 1);
    const state = await submitCommission(initialFormState, form(valid, [big]));
    expect(state.errors).toEqual({ photos: "huge.jpg is larger than 5 MB." });
    expect(deliverSubmission).not.toHaveBeenCalled();
  });

  it("accepts a photo of exactly 5 MB", async () => {
    await submitCommission(initialFormState, form(valid, [jpeg("edge.jpg", 5 * 1024 * 1024)]));
    expect(deliverSubmission).toHaveBeenCalledTimes(1);
  });

  it("reports schema errors before looking at photos", async () => {
    const state = await submitCommission(initialFormState, form({ ...valid, size: "", budget: "", shipTo: "" }));
    expect(state.errors).toEqual({
      size: "Please choose a size.",
      budget: "Please choose a budget range.",
      shipTo: "Please tell us where it would ship to.",
    });
  });

  it("ignores spam", async () => {
    expect(await submitCommission(initialFormState, form({ ...valid, website: "x" }))).toEqual({ status: "success" });
    expect(deliverSubmission).not.toHaveBeenCalled();
  });
});

describe("subscribeNewsletter", () => {
  it("signs up a valid email", async () => {
    const state = await subscribeNewsletter(initialFormState, form({ email: "fan@b.test" }));
    expect(state).toEqual({ status: "success", message: "You're on the list! 🎨" });
    expect(deliverSubmission).toHaveBeenCalledWith("newsletter", { email: "fan@b.test" });
  });

  it("rejects an invalid email", async () => {
    const state = await subscribeNewsletter(initialFormState, form({ email: "fan@" }));
    expect(state).toEqual({
      status: "error",
      message: invalid,
      values: { email: "fan@" },
      errors: { email: "Please enter a valid email address." },
    });
  });

  it("ignores spam", async () => {
    expect(await subscribeNewsletter(initialFormState, form({ website: "x" }))).toEqual({ status: "success" });
    expect(deliverSubmission).not.toHaveBeenCalled();
  });
});
