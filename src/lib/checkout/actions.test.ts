import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internationalShippingCountries, site } from "@/config/site";
import type { Artwork } from "@/lib/types";
import { startCheckout } from "./actions";
import type { CheckoutRequestItem, Destination } from "./order";

const { headers, loadArtworksFresh, isStripeConfigured, createSession } = vi.hoisted(() => ({
  headers: vi.fn(),
  loadArtworksFresh: vi.fn(),
  isStripeConfigured: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers }));
vi.mock("@/lib/content", () => ({ loadArtworksFresh }));
vi.mock("@/lib/stripe", () => ({
  isStripeConfigured,
  getStripe: () => ({ checkout: { sessions: { create: createSession } } }),
}));

const painting: Artwork = {
  slug: "sunset",
  title: "Sunset",
  year: 2025,
  medium: "Acrylic on canvas",
  widthIn: 24,
  heightIn: 24,
  description: [],
  collections: [],
  original: { status: "available", saleMode: "buy-now", price: 185000 },
  printsEnabled: true,
  image: { src: "https://cdn.sanity.io/sunset.jpg", width: 2000, height: 2000, alt: "Sunset" },
  placeholder: { seed: 1, palette: ["#000"], style: "abstract" },
};

const noImage: Artwork = { ...painting, slug: "meadow", title: "Meadow", image: undefined };

const cart: CheckoutRequestItem[] = [
  { slug: "sunset", kind: "original", quantity: 1 },
  { slug: "sunset", kind: "print", printOptionId: "paper-12x12", quantity: 2 },
];

const NOW = new Date("2026-05-01T12:00:00.000Z");

function setHeaders(values: Record<string, string>) {
  headers.mockResolvedValue(new Headers(values));
}

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  isStripeConfigured.mockReset().mockReturnValue(true);
  loadArtworksFresh.mockReset().mockResolvedValue([painting, noImage]);
  createSession.mockReset().mockResolvedValue({ url: "https://checkout.stripe.test/s/1" });
  setHeaders({ host: "shop.test" });
});

afterEach(() => {
  vi.useRealTimers();
});

const cartError = { error: "Something went wrong with your cart. Please refresh and try again." };

describe("startCheckout guards", () => {
  it("refuses when Stripe isn't configured", async () => {
    isStripeConfigured.mockReturnValue(false);
    expect(await startCheckout(cart, "us")).toEqual({
      error: "Online checkout isn't switched on yet. Please contact us to buy.",
    });
    expect(loadArtworksFresh).not.toHaveBeenCalled();
  });

  it("rejects a cart that isn't a list", async () => {
    expect(await startCheckout("nope" as unknown as CheckoutRequestItem[], "us")).toEqual(cartError);
  });

  it("rejects a cart with more than 50 items", async () => {
    const items = Array.from({ length: 51 }, () => cart[1]);
    expect(await startCheckout(items, "us")).toEqual(cartError);
    expect(loadArtworksFresh).not.toHaveBeenCalled();
  });

  it("accepts a cart with exactly 50 items", async () => {
    const items = Array.from({ length: 50 }, () => cart[1]);
    expect(await startCheckout(items, "us")).toEqual({ url: "https://checkout.stripe.test/s/1" });
  });

  it("rejects an unknown destination", async () => {
    expect(await startCheckout(cart, "mars" as Destination)).toEqual(cartError);
    expect(loadArtworksFresh).not.toHaveBeenCalled();
  });

  it("returns the order error without contacting Stripe", async () => {
    expect(await startCheckout([], "us")).toEqual({ error: "Your cart is empty." });
    expect(createSession).not.toHaveBeenCalled();
  });

  it("loads each slug once from fresh data", async () => {
    await startCheckout(cart, "us");
    expect(loadArtworksFresh).toHaveBeenCalledWith(["sunset"]);
  });
});

describe("startCheckout Stripe session", () => {
  it("builds the exact US session params", async () => {
    vi.stubEnv("STRIPE_AUTOMATIC_TAX", "");
    const result = await startCheckout(cart, "us");

    expect(result).toEqual({ url: "https://checkout.stripe.test/s/1" });
    expect(createSession).toHaveBeenCalledWith({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 185000,
            product_data: {
              name: "Sunset (original painting)",
              description: "Acrylic on canvas, 24″ × 24″. One of a kind.",
              images: ["https://cdn.sanity.io/sunset.jpg?w=600&auto=format"],
              metadata: { slug: "sunset", kind: "original", printOptionId: "" },
            },
          },
        },
        {
          quantity: 2,
          price_data: {
            currency: "usd",
            unit_amount: 4500,
            product_data: {
              name: "Sunset (fine art print, 12″ × 12″)",
              description: "12″ × 12″, hand-signed.",
              images: ["https://cdn.sanity.io/sunset.jpg?w=600&auto=format"],
              metadata: { slug: "sunset", kind: "print", printOptionId: "paper-12x12" },
            },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: "Standard shipping (tracked)",
            // Medium original ($60) + first paper print ($9) + one extra ($3).
            fixed_amount: { amount: 7200, currency: "usd" },
          },
        },
      ],
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: false },
      metadata: { destination: "us", hasOriginal: "true" },
      expires_at: Math.floor(NOW.getTime() / 1000) + 30 * 60,
      success_url: "https://shop.test/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://shop.test/cart",
    });
  });

  it("builds international params with the allowed country list", async () => {
    await startCheckout([{ slug: "meadow", kind: "print", printOptionId: "canvas-12x12", quantity: 1 }], "intl");
    const params = createSession.mock.calls[0][0];

    expect(params.shipping_address_collection.allowed_countries).toEqual([...internationalShippingCountries]);
    expect(params.shipping_options[0].shipping_rate_data).toEqual({
      type: "fixed_amount",
      display_name: "International shipping (tracked)",
      fixed_amount: { amount: 3900, currency: "usd" },
    });
    expect(params.metadata).toEqual({ destination: "intl", hasOriginal: "false" });
    expect(params.line_items[0].price_data.product_data.images).toBeUndefined();
  });

  it("turns on automatic tax when STRIPE_AUTOMATIC_TAX is true", async () => {
    vi.stubEnv("STRIPE_AUTOMATIC_TAX", "true");
    await startCheckout(cart, "us");
    expect(createSession.mock.calls[0][0].automatic_tax).toEqual({ enabled: true });
  });
});

describe("startCheckout return URLs", () => {
  it("prefers the forwarded host and protocol from a proxy", async () => {
    setHeaders({ host: "internal:3000", "x-forwarded-host": "melissa.art", "x-forwarded-proto": "http" });
    await startCheckout(cart, "us");
    expect(createSession.mock.calls[0][0].cancel_url).toBe("http://melissa.art/cart");
  });

  it("uses the host header over https when there is no proxy", async () => {
    setHeaders({ host: "shop.test" });
    await startCheckout(cart, "us");
    expect(createSession.mock.calls[0][0].success_url).toBe(
      "https://shop.test/checkout/success?session_id={CHECKOUT_SESSION_ID}",
    );
  });

  it("falls back to the configured site URL without a host header", async () => {
    setHeaders({});
    await startCheckout(cart, "us");
    expect(createSession.mock.calls[0][0].cancel_url).toBe(`${site.url}/cart`);
  });
});

describe("startCheckout failures", () => {
  const failure = { error: "We couldn't start checkout just now. Please try again in a moment." };

  it("reports an error when Stripe returns no URL", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    createSession.mockResolvedValue({ url: null });
    expect(await startCheckout(cart, "us")).toEqual(failure);
    expect(error).toHaveBeenCalledWith("[checkout] failed to create session", new Error("Stripe returned no checkout URL"));
  });

  it("reports an error when Stripe throws", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("rate limited");
    createSession.mockRejectedValue(boom);
    expect(await startCheckout(cart, "us")).toEqual(failure);
    expect(error).toHaveBeenCalledWith("[checkout] failed to create session", boom);
  });
});
