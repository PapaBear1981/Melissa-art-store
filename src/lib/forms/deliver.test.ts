import { beforeEach, describe, expect, it, vi } from "vitest";
import { deliverSubmission, type Attachment } from "./deliver";

const { loadSiteSettings, sendEmail, notificationEmail, getWriteClient } = vi.hoisted(() => ({
  loadSiteSettings: vi.fn(),
  sendEmail: vi.fn(),
  notificationEmail: vi.fn(),
  getWriteClient: vi.fn(),
}));

vi.mock("@/lib/content", () => ({ loadSiteSettings }));
vi.mock("@/lib/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/email")>()),
  sendEmail,
  notificationEmail,
}));
vi.mock("@/sanity/writeClient", () => ({ getWriteClient }));

function fakeWriteClient() {
  let n = 0;
  return {
    assets: { upload: vi.fn(async () => ({ _id: `image-asset-${++n}` })) },
    create: vi.fn(async () => ({})),
  };
}

const commissionFields = {
  name: "Ann",
  email: "ann@b.test",
  size: "24×36",
  customSize: "",
  subject: "My garden in spring",
  colors: "Pinks",
  budget: "$1,000–2,000",
  deadline: "",
  shipTo: "Canada",
  notes: "Thanks!",
};

const photos: Attachment[] = [
  { filename: "a.jpg", contentType: "image/jpeg", size: 3, content: Buffer.from("aaa") },
  { filename: "b.png", contentType: "image/png", size: 2, content: Buffer.from("bb") },
];

beforeEach(() => {
  loadSiteSettings.mockReset().mockResolvedValue({ email: "public@art.test", location: "" });
  sendEmail.mockReset().mockResolvedValue(true);
  notificationEmail.mockReset().mockReturnValue("");
  getWriteClient.mockReset().mockReturnValue(null);
});

describe("deliverSubmission emails", () => {
  it("emails a contact message to the public address with the sender as reply-to", async () => {
    await deliverSubmission("contact", { name: "Ann", email: "ann@b.test", topic: "general", message: "Hello!" });
    expect(sendEmail).toHaveBeenCalledWith({
      to: "public@art.test",
      replyTo: "ann@b.test",
      subject: "Website message from Ann (general)",
      text: "name: Ann\nemail: ann@b.test\ntopic: general\nmessage: Hello!",
      attachments: [],
    });
    expect(getWriteClient).not.toHaveBeenCalled();
  });

  it("prefers NOTIFICATION_EMAIL over the public address", async () => {
    notificationEmail.mockReturnValue("orders@art.test");
    await deliverSubmission("newsletter", { email: "fan@b.test" });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "orders@art.test", subject: "New newsletter signup: fan@b.test" }),
    );
  });

  it("names the artwork in an inquiry subject", async () => {
    await deliverSubmission("inquiry", { name: "Bo", email: "bo@b.test", artwork: "Tidewater", country: "US", message: "" });
    expect(sendEmail.mock.calls[0][0].subject).toBe("Inquiry about “Tidewater” from Bo");
  });
});

describe("deliverSubmission for commissions", () => {
  it("still emails when there is no write token, without saving", async () => {
    await deliverSubmission("commission", commissionFields, photos);
    expect(getWriteClient).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Commission request from Ann: 24×36",
        attachments: [
          { filename: "a.jpg", content: photos[0].content },
          { filename: "b.png", content: photos[1].content },
        ],
      }),
    );
  });

  it("uploads the photos and saves the request on the dashboard", async () => {
    vi.useFakeTimers({ now: new Date("2026-03-04T05:06:07.000Z"), toFake: ["Date"] });
    const write = fakeWriteClient();
    getWriteClient.mockReturnValue(write);

    await deliverSubmission("commission", commissionFields, photos);
    vi.useRealTimers();

    expect(write.assets.upload).toHaveBeenNthCalledWith(1, "image", photos[0].content, { filename: "a.jpg", contentType: "image/jpeg" });
    expect(write.assets.upload).toHaveBeenNthCalledWith(2, "image", photos[1].content, { filename: "b.png", contentType: "image/png" });
    expect(write.create).toHaveBeenCalledWith({
      _type: "commissionRequest",
      status: "new",
      receivedAt: "2026-03-04T05:06:07.000Z",
      name: "Ann",
      email: "ann@b.test",
      size: "24×36",
      customSize: "",
      subject: "My garden in spring",
      colors: "Pinks",
      budget: "$1,000–2,000",
      deadline: "",
      shipTo: "Canada",
      customerNotes: "Thanks!",
      photos: [
        { _key: "photo0", _type: "image", asset: { _type: "reference", _ref: "image-asset-1" } },
        { _key: "photo1", _type: "image", asset: { _type: "reference", _ref: "image-asset-2" } },
      ],
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("saves a request without photos when none were attached", async () => {
    const write = fakeWriteClient();
    getWriteClient.mockReturnValue(write);
    await deliverSubmission("commission", commissionFields);
    expect(write.assets.upload).not.toHaveBeenCalled();
    expect(write.create).toHaveBeenCalledWith(expect.objectContaining({ photos: [] }));
    expect(sendEmail.mock.calls[0][0].attachments).toEqual([]);
  });

  it("logs a failed save and still sends the email", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const write = fakeWriteClient();
    const boom = new Error("upload failed");
    write.assets.upload.mockRejectedValueOnce(boom);
    getWriteClient.mockReturnValue(write);

    await deliverSubmission("commission", commissionFields, photos);

    expect(error).toHaveBeenCalledWith("[forms] could not save commission request", boom);
    expect(write.create).not.toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
