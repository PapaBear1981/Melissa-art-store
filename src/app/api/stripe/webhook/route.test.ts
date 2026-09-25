import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { fulfillCheckout, isStripeConfigured, constructEvent } = vi.hoisted(() => ({
  fulfillCheckout: vi.fn(),
  isStripeConfigured: vi.fn(),
  constructEvent: vi.fn(),
}));

vi.mock("@/lib/orders/fulfill", () => ({ fulfillCheckout }));
vi.mock("@/lib/stripe", () => ({
  isStripeConfigured,
  getStripe: () => ({ webhooks: { constructEvent } }),
}));

function request(signature?: string, body = '{"id":"evt_1"}') {
  const headers: Record<string, string> = signature ? { "stripe-signature": signature } : {};
  return new Request("https://shop.test/api/stripe/webhook", { method: "POST", headers, body }) as unknown as NextRequest;
}

const paidSession = { id: "cs_1", payment_status: "paid" };

beforeEach(() => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_1");
  isStripeConfigured.mockReset().mockReturnValue(true);
  constructEvent.mockReset().mockReturnValue({ type: "checkout.session.completed", data: { object: paidSession } });
  fulfillCheckout.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/stripe/webhook", () => {
  it("returns 500 when Stripe isn't configured", async () => {
    isStripeConfigured.mockReturnValue(false);
    const res = await POST(request("sig"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Stripe webhook not configured" });
  });

  it("returns 500 when the webhook secret is missing", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const res = await POST(request("sig"));
    expect(res.status).toBe(500);
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when the signature header is missing", async () => {
    const res = await POST(request());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "Missing signature" });
  });

  it("returns 400 when the signature doesn't verify", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("No signatures found");
    });
    const res = await POST(request("bad"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "Invalid signature" });
    expect(fulfillCheckout).not.toHaveBeenCalled();
  });

  it("verifies the raw body and fulfills a paid checkout", async () => {
    const res = await POST(request("t=1,v1=abc", '{"raw":true}'));
    expect(constructEvent).toHaveBeenCalledWith('{"raw":true}', "t=1,v1=abc", "whsec_1");
    expect(fulfillCheckout).toHaveBeenCalledWith(paidSession);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });

  it("fulfills a delayed payment once it succeeds", async () => {
    constructEvent.mockReturnValue({ type: "checkout.session.async_payment_succeeded", data: { object: paidSession } });
    await POST(request("sig"));
    expect(fulfillCheckout).toHaveBeenCalledWith(paidSession);
  });

  it("acknowledges an unpaid checkout without fulfilling it", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_2", payment_status: "unpaid" } },
    });
    const res = await POST(request("sig"));
    expect(res.status).toBe(200);
    expect(fulfillCheckout).not.toHaveBeenCalled();
  });

  it("acknowledges other event types without fulfilling", async () => {
    constructEvent.mockReturnValue({ type: "charge.refunded", data: { object: {} } });
    const res = await POST(request("sig"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(fulfillCheckout).not.toHaveBeenCalled();
  });

  it("returns 500 so Stripe retries when fulfillment fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("sanity down");
    fulfillCheckout.mockRejectedValue(boom);
    const res = await POST(request("sig"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Fulfillment failed" });
    expect(error).toHaveBeenCalledWith("[stripe-webhook] fulfillment failed", boom);
  });
});
