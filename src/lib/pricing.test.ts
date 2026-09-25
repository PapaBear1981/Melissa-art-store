import { describe, expect, it } from "vitest";
import { originalShipping, priceSummary } from "./pricing";
import type { Artwork } from "./types";

function artwork(
  original: Partial<Artwork["original"]> = {},
  overrides: Partial<Artwork> = {},
): Artwork {
  return {
    slug: "test-piece",
    title: "Test Piece",
    year: 2025,
    medium: "Acrylic on canvas",
    widthIn: 24,
    heightIn: 36,
    description: [],
    collections: [],
    original: { status: "available", saleMode: "buy-now", price: 185000, ...original },
    printsEnabled: true,
    placeholder: { seed: 1, palette: ["#000"], style: "abstract" },
    ...overrides,
  };
}

describe("priceSummary", () => {
  it("shows the price of an original that can be bought now", () => {
    expect(priceSummary(artwork())).toBe("$1,850");
  });

  it("adds 'Inquire' when the original is sold by inquiry", () => {
    expect(priceSummary(artwork({ saleMode: "inquire" }))).toBe("$1,850 · Inquire");
  });

  it("hides the price for private inquiries or a missing price", () => {
    expect(priceSummary(artwork({ saleMode: "inquire-private" }))).toBe("Price on request");
    expect(priceSummary(artwork({ price: undefined }))).toBe("Price on request");
  });

  it("falls back to the cheapest print once the original is gone", () => {
    expect(priceSummary(artwork({ status: "sold" }))).toBe("Prints from $45");
    expect(priceSummary(artwork({ status: "not-for-sale" }))).toBe("Prints from $45");
  });

  it("has nothing to show for a sold original without prints", () => {
    expect(priceSummary(artwork({ status: "sold" }, { printsEnabled: false }))).toBeNull();
  });
});

describe("originalShipping", () => {
  it("uses a per-piece override when one is set", () => {
    expect(originalShipping(artwork({ shipping: { us: 1234, intl: 5678 } }))).toEqual({
      kind: "rate",
      us: 1234,
      intl: 5678,
      label: "Custom",
    });
  });

  it("picks the size tier from the longest side, inclusive of the tier limit", () => {
    const size = (widthIn: number, heightIn: number) =>
      originalShipping(artwork({}, { widthIn, heightIn }));
    expect(size(12, 16)).toEqual({ kind: "rate", us: 2500, intl: 7500, label: "Small" });
    expect(size(17, 10)).toEqual({ kind: "rate", us: 6000, intl: 17500, label: "Medium" });
    expect(size(24, 30)).toEqual({ kind: "rate", us: 6000, intl: 17500, label: "Medium" });
    expect(size(48, 48)).toEqual({ kind: "rate", us: 15000, intl: 40000, label: "Large" });
  });

  it("asks for a personal quote above 48 inches", () => {
    expect(originalShipping(artwork({}, { widthIn: 49, heightIn: 20 }))).toEqual({ kind: "quote" });
  });

  it("asks for a quote when the size is not a number and no tier matches", () => {
    expect(originalShipping(artwork({}, { widthIn: Number.NaN }))).toEqual({ kind: "quote" });
  });
});
