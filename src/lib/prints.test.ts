import { describe, expect, it } from "vitest";
import { getPrintOption, getPrintOptions, lowestPrintPrice } from "./prints";
import type { Artwork } from "./types";

function artwork(overrides: Partial<Artwork> = {}): Artwork {
  return {
    slug: "test-piece",
    title: "Test Piece",
    year: 2025,
    medium: "Acrylic on canvas",
    widthIn: 24,
    heightIn: 36,
    description: [],
    collections: [],
    original: { status: "available", saleMode: "buy-now", price: 100000 },
    printsEnabled: true,
    placeholder: { seed: 1, palette: ["#000"], style: "abstract" },
    ...overrides,
  };
}

describe("getPrintOptions", () => {
  it("offers nothing when prints are turned off", () => {
    expect(getPrintOptions(artwork({ printsEnabled: false }))).toEqual([]);
  });

  it("offers 2:3 portrait sizes on paper then canvas, priced by the long side", () => {
    const options = getPrintOptions(artwork({ widthIn: 24, heightIn: 36 }));
    expect(options.map((o) => [o.id, o.price])).toEqual([
      ["paper-8x12", 4500],
      ["paper-12x18", 8500],
      ["paper-20x30", 12500],
      ["paper-24x36", 17500],
      ["canvas-8x12", 8500],
      ["canvas-12x18", 16500],
      ["canvas-20x30", 22500],
      ["canvas-24x36", 32000],
    ]);
    expect(options[0]).toEqual({
      id: "paper-8x12",
      material: "paper",
      widthIn: 8,
      heightIn: 12,
      price: 4500,
    });
  });

  it("turns sizes sideways for landscape paintings", () => {
    const ids = getPrintOptions(artwork({ widthIn: 36, heightIn: 24 })).map((o) => o.id);
    expect(ids.slice(0, 4)).toEqual(["paper-12x8", "paper-18x12", "paper-30x20", "paper-36x24"]);
  });

  it("uses square sizes for square paintings", () => {
    const options = getPrintOptions(artwork({ widthIn: 20, heightIn: 20 }));
    expect(options.filter((o) => o.material === "paper").map((o) => [o.id, o.price])).toEqual([
      ["paper-8x8", 4500],
      ["paper-12x12", 4500],
      ["paper-20x20", 8500],
      ["paper-30x30", 12500],
    ]);
  });

  it("picks the closest standard ratio for odd proportions", () => {
    // 16×20 is exactly 4:5.
    expect(getPrintOptions(artwork({ widthIn: 16, heightIn: 20 })).map((o) => o.id)).toContain("paper-16x20");
    // 30×40 (3:4) includes the largest size, priced in the top tier.
    const big = getPrintOption(artwork({ widthIn: 30, heightIn: 40 }), "canvas-30x40");
    expect(big?.price).toBe(32000);
    // 20×29 (1.45) is closer to 2:3 than to 3:4.
    expect(getPrintOptions(artwork({ widthIn: 20, heightIn: 29 })).map((o) => o.id)).toContain("paper-24x36");
  });
});

describe("getPrintOption", () => {
  it("finds an option by id and returns undefined for unknown ids", () => {
    const a = artwork();
    expect(getPrintOption(a, "canvas-20x30")?.price).toBe(22500);
    expect(getPrintOption(a, "canvas-99x99")).toBeUndefined();
  });
});

describe("lowestPrintPrice", () => {
  it("is the cheapest option, or undefined without prints", () => {
    expect(lowestPrintPrice(artwork())).toBe(4500);
    expect(lowestPrintPrice(artwork({ printsEnabled: false }))).toBeUndefined();
  });
});
