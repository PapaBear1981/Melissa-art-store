import { beforeEach, describe, expect, it, vi } from "vitest";
import { fieldLines, notificationEmail, sendEmail } from "./email";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

function sentBody() {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return JSON.parse(init.body as string);
}

describe("sendEmail without an API key", () => {
  it("logs the email instead of sending it", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    const sent = await sendEmail({
      to: "a@b.test",
      subject: "Hi",
      text: "Body",
      attachments: [{ filename: "photo.jpg", content: Buffer.from("x") }],
    });

    expect(sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith("[email:not-sent] RESEND_API_KEY not set", {
      to: "a@b.test",
      subject: "Hi",
      text: "Body",
      attachments: ["photo.jpg"],
    });
  });

  it("logs no attachment names when there are none", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendEmail({ to: ["a@b.test"], subject: "Hi", text: "Body" });
    expect(info.mock.calls[0][1]).toMatchObject({ to: ["a@b.test"], attachments: undefined });
  });
});

describe("sendEmail through Resend", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_key");
  });

  it("posts the email to Resend and reports success", async () => {
    vi.stubEnv("EMAIL_FROM", "");
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    const sent = await sendEmail({
      to: "buyer@b.test",
      subject: "Thanks",
      text: "Plain",
      html: "<p>Plain</p>",
      replyTo: "melissa@art.test",
    });

    expect(sent).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Authorization: "Bearer re_key", "Content-Type": "application/json" });
    expect(sentBody()).toEqual({
      from: "Melissa's Art <onboarding@resend.dev>",
      to: "buyer@b.test",
      subject: "Thanks",
      text: "Plain",
      html: "<p>Plain</p>",
      reply_to: "melissa@art.test",
    });
  });

  it("uses EMAIL_FROM when it is set", async () => {
    vi.stubEnv("EMAIL_FROM", "Melissa <hi@melissa.art>");
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await sendEmail({ to: "x@y.test", subject: "s", text: "t" });
    expect(sentBody().from).toBe("Melissa <hi@melissa.art>");
  });

  it("sends attachments base64-encoded", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await sendEmail({
      to: "x@y.test",
      subject: "s",
      text: "t",
      attachments: [
        { filename: "a.txt", content: Buffer.from("hello") },
        { filename: "b.bin", content: Buffer.from([0, 255]) },
      ],
    });
    expect(sentBody().attachments).toEqual([
      { filename: "a.txt", content: "aGVsbG8=" },
      { filename: "b.bin", content: "AP8=" },
    ]);
  });

  it("logs Resend's error and reports failure", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("domain not verified", { status: 403 }));

    const sent = await sendEmail({ to: "x@y.test", subject: "s", text: "t" });

    expect(sent).toBe(false);
    expect(error).toHaveBeenCalledWith("[email] Resend error", 403, "domain not verified");
  });
});

describe("notificationEmail", () => {
  it("returns NOTIFICATION_EMAIL, or an empty string when unset", () => {
    vi.stubEnv("NOTIFICATION_EMAIL", "orders@art.test");
    expect(notificationEmail()).toBe("orders@art.test");
    vi.stubEnv("NOTIFICATION_EMAIL", undefined);
    expect(notificationEmail()).toBe("");
  });
});

describe("fieldLines", () => {
  it("writes one Label: value line per filled-in field, skipping empty ones", () => {
    expect(fieldLines({ name: "Ann", email: "", topic: undefined, message: "Hello there" })).toBe(
      "name: Ann\nmessage: Hello there",
    );
  });

  it("returns an empty string when nothing is filled in", () => {
    expect(fieldLines({ a: "", b: undefined })).toBe("");
  });
});
