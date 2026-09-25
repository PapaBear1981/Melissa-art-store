import { describe, expect, it } from "vitest";
import type { Artwork } from "@/lib/types";
import { buildOrder, type CheckoutRequestItem, type OrderResult } from "./order";

function artwork(overrides: Partial<Artwork> = {}): Artwork {
  return {
    slug: "golden-hour-hills",
    title: "Golden Hour Hills",
    year: 2025,
    medium: "Acrylic on canvas",
    widthIn: 36,
    heightIn: 24,
    description: [],
    collections: [],
    original: { status: "available", saleMode: "buy-now", price: 185000 },
    printsEnabled: true,
    placeholder: { seed: 1, palette: ["#000"], style: "abstract" },
    ...overrides,
  };
}

function catalog(...artworks: Artwork[]) {
  return new Map(artworks.map((a) => [a.slug, a]));
}

const original = (slug = "golden-hour-hills"): CheckoutRequestItem => ({ slug, kind: "original", quantity: 1 });
const print = (printOptionId: string | undefined, quantity = 1, slug = "golden-hour-hills"): CheckoutRequestItem => ({
  slug,
  kind: "print",
  printOptionId,
  quantity,
});

function expectOk(result: OrderResult) {
  if (!result.ok) throw new Error(`expected ok order, got: ${result.error}`);
  return result;
}

describe("buildOrder errors", () => {
  it("rejects an empty cart", () => {
    expect(buildOrder([], catalog(artwork()), "us")).toEqual({ ok: false, error: "Your cart is empty." });
  });

  it("rejects a piece that no longer exists", () => {
    expect(buildOrder([original("gone")], catalog(artwork()), "us")).toEqual({
      ok: false,
      error: "One of the pieces in your cart is no longer available. Please remove it and try again.",
    });
  });

  const unavailable = "Sorry, the original “Golden Hour Hills” is no longer available to buy online. Please remove it from your cart.";

  it.each<[string, Artwork["original"]]>([
    ["sold", { status: "sold", saleMode: "buy-now", price: 185000 }],
    ["not for sale", { status: "not-for-sale", saleMode: "buy-now", price: 185000 }],
    ["sold by inquiry", { status: "available", saleMode: "inquire", price: 185000 }],
    ["price on request", { status: "available", saleMode: "inquire-private", price: 185000 }],
    ["missing a price", { status: "available", saleMode: "buy-now" }],
    ["priced at zero", { status: "available", saleMode: "buy-now", price: 0 }],
  ])("rejects an original that is %s", (_, orig) => {
    expect(buildOrder([original()], catalog(artwork({ original: orig })), "us")).toEqual({ ok: false, error: unavailable });
  });

  it("rejects an original that needs a personal shipping quote", () => {
    const big = artwork({ widthIn: 60, heightIn: 60 });
    expect(buildOrder([original()], catalog(big), "us")).toEqual({
      ok: false,
      error: "“Golden Hour Hills” needs a personal shipping quote. Please contact us to buy this piece.",
    });
  });

  const noSize = "The print size you chose for “Golden Hour Hills” is no longer offered. Please remove it and choose again.";

  it("rejects a print with no size chosen", () => {
    expect(buildOrder([print(undefined)], catalog(artwork()), "us")).toEqual({ ok: false, error: noSize });
  });

  it("rejects a print size that doesn't exist for this painting", () => {
    expect(buildOrder([print("paper-8x8")], catalog(artwork()), "us")).toEqual({ ok: false, error: noSize });
  });

  it("rejects prints once prints are turned off", () => {
    expect(buildOrder([print("paper-12x8")], catalog(artwork({ printsEnabled: false })), "us")).toEqual({
      ok: false,
      error: noSize,
    });
  });

  it("fails the whole order if any line is bad, even after good lines", () => {
    const result = buildOrder([print("paper-12x8"), original("gone")], catalog(artwork()), "us");
    expect(result.ok).toBe(false);
  });
});

describe("buildOrder originals", () => {
  it("prices an original from the server data and ignores the requested quantity", () => {
    const result = expectOk(buildOrder([{ ...original(), quantity: 5 }], catalog(artwork()), "us"));
    expect(result.lines).toEqual([
      {
        slug: "golden-hour-hills",
        kind: "original",
        name: "Golden Hour Hills (original painting)",
        description: "Acrylic on canvas, 36″ × 24″. One of a kind.",
        unitAmount: 185000,
        quantity: 1,
        imageUrl: undefined,
      },
    ]);
    expect(result.subtotal).toBe(185000);
  });

  it("charges the size tier's US or international rate", () => {
    // Longest side 36″ → Large tier.
    expect(expectOk(buildOrder([original()], catalog(artwork()), "us")).shipping).toBe(15000);
    expect(expectOk(buildOrder([original()], catalog(artwork()), "intl")).shipping).toBe(40000);
    const medium = artwork({ widthIn: 24, heightIn: 30 });
    expect(expectOk(buildOrder([original()], catalog(medium), "us")).shipping).toBe(6000);
    expect(expectOk(buildOrder([original()], catalog(medium), "intl")).shipping).toBe(17500);
  });

  it("uses a per-piece shipping override", () => {
    const custom = artwork({
      original: { status: "available", saleMode: "buy-now", price: 50000, shipping: { us: 1111, intl: 2222 } },
    });
    expect(expectOk(buildOrder([original()], catalog(custom), "us")).shipping).toBe(1111);
    expect(expectOk(buildOrder([original()], catalog(custom), "intl")).shipping).toBe(2222);
  });

  it("adds up shipping for several originals", () => {
    const small = artwork({ slug: "small", title: "Small", widthIn: 12, heightIn: 12, original: { status: "available", saleMode: "buy-now", price: 42000 } });
    const result = expectOk(buildOrder([original(), original("small")], catalog(artwork(), small), "us"));
    expect(result.shipping).toBe(15000 + 2500);
    expect(result.subtotal).toBe(185000 + 42000);
  });

  it("links a resized image when the painting has a photo", () => {
    const withImage = artwork({ image: { src: "https://cdn.example/img.jpg", width: 10, height: 10, alt: "" } });
    const result = expectOk(buildOrder([original()], catalog(withImage), "us"));
    expect(result.lines[0].imageUrl).toBe("https://cdn.example/img.jpg?w=600&auto=format");
  });
});

describe("buildOrder prints", () => {
  it("prices a print from the catalog and names its material and size", () => {
    const result = expectOk(buildOrder([print("canvas-30x20", 2)], catalog(artwork()), "us"));
    expect(result.lines).toEqual([
      {
        slug: "golden-hour-hills",
        kind: "print",
        printOptionId: "canvas-30x20",
        name: "Golden Hour Hills (stretched canvas, 30″ × 20″)",
        description: "30″ × 20″, hand-signed.",
        unitAmount: 22500,
        quantity: 2,
        imageUrl: undefined,
      },
    ]);
    expect(result.subtotal).toBe(45000);
  });

  it.each([
    ["not a number", Number.NaN, 1],
    ["zero", 0, 1],
    ["negative", -3, 1],
    ["a fraction", 2.7, 2],
    ["below one as a fraction", 0.5, 1],
    ["above the limit", 15, 10],
    ["exactly the limit", 10, 10],
  ])("clamps a quantity that is %s", (_, requested, expected) => {
    const result = expectOk(buildOrder([print("paper-12x8", requested)], catalog(artwork()), "us"));
    expect(result.lines[0].quantity).toBe(expected);
    expect(result.subtotal).toBe(4500 * expected);
  });

  it("charges full shipping for the first paper print and the extra rate after", () => {
    const items = [print("paper-12x8", 3)];
    expect(expectOk(buildOrder(items, catalog(artwork()), "us")).shipping).toBe(900 + 300 * 2);
    expect(expectOk(buildOrder(items, catalog(artwork()), "intl")).shipping).toBe(1900 + 600 * 2);
  });

  it("charges the canvas rates for canvas prints", () => {
    const items = [print("canvas-12x8", 2)];
    expect(expectOk(buildOrder(items, catalog(artwork()), "us")).shipping).toBe(1900 + 900);
    expect(expectOk(buildOrder(items, catalog(artwork()), "intl")).shipping).toBe(3900 + 1900);
  });

  it("counts prints across lines per material, each with its own first-print rate", () => {
    const items = [print("paper-12x8", 2), print("paper-36x24", 1), print("canvas-12x8", 1), print("canvas-18x12", 1)];
    // Paper: 3 prints, canvas: 2 prints.
    expect(expectOk(buildOrder(items, catalog(artwork()), "us")).shipping).toBe(900 + 300 * 2 + 1900 + 900);
    expect(expectOk(buildOrder(items, catalog(artwork()), "intl")).shipping).toBe(1900 + 600 * 2 + 3900 + 1900);
  });

  it("uses the clamped quantity when counting prints for shipping", () => {
    const result = expectOk(buildOrder([print("paper-12x8", 50)], catalog(artwork()), "us"));
    expect(result.shipping).toBe(900 + 300 * 9);
  });

  it("combines original and print shipping in one order", () => {
    const result = expectOk(buildOrder([original(), print("paper-12x8", 1)], catalog(artwork()), "intl"));
    expect(result.shipping).toBe(40000 + 1900);
    expect(result.subtotal).toBe(185000 + 4500);
    expect(result.lines.map((l) => l.kind)).toEqual(["original", "print"]);
  });
});
