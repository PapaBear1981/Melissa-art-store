import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { parseBody, revalidateTag } = vi.hoisted(() => ({ parseBody: vi.fn(), revalidateTag: vi.fn() }));

vi.mock("next-sanity/webhook", () => ({ parseBody }));
vi.mock("next/cache", () => ({ revalidateTag }));

const request = () =>
  new Request("https://shop.test/api/revalidate", { method: "POST", body: "{}" }) as unknown as NextRequest;

beforeEach(() => {
  parseBody.mockReset();
  revalidateTag.mockReset();
});

describe("POST /api/revalidate", () => {
  it("returns 500 when the webhook secret isn't configured", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "");
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Webhook secret not configured" });
    expect(parseBody).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid signature without clearing the cache", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "s3cret");
    parseBody.mockResolvedValue({ isValidSignature: false, body: null });
    const req = request();

    const res = await POST(req);

    expect(parseBody).toHaveBeenCalledWith(req, "s3cret", true);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Invalid signature" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("clears the Sanity cache and reports the document type", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "s3cret");
    parseBody.mockResolvedValue({ isValidSignature: true, body: { _type: "artwork" } });

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: true, type: "artwork" });
    expect(revalidateTag).toHaveBeenCalledWith("sanity", { expire: 0 });
  });

  it("reports a null type when the body has none", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "s3cret");
    parseBody.mockResolvedValue({ isValidSignature: true, body: null });
    const res = await POST(request());
    expect(await res.json()).toEqual({ revalidated: true, type: null });
  });
});
