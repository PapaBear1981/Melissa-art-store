import { describe, expect, it } from "vitest";
import { sampleArtworks, sampleCollections } from "./sample-data";

describe("sample content", () => {
  it("has unique artwork and collection slugs", () => {
    const art = sampleArtworks.map((a) => a.slug);
    const cols = sampleCollections.map((c) => c.slug);
    expect(new Set(art).size).toBe(art.length);
    expect(new Set(cols).size).toBe(cols.length);
  });

  it("only puts artworks in collections that exist", () => {
    const cols = new Set(sampleCollections.map((c) => c.slug));
    for (const a of sampleArtworks) {
      expect(a.collections.length, a.slug).toBeGreaterThan(0);
      for (const c of a.collections) expect(cols, `${a.slug} → ${c}`).toContain(c);
    }
  });

  it("gives every collection a cover painting that belongs to it", () => {
    for (const c of sampleCollections) {
      const cover = sampleArtworks.find((a) => a.slug === c.cover);
      expect(cover?.collections, c.slug).toContain(c.slug);
    }
  });

  it("prices every buy-now original that is still available", () => {
    for (const a of sampleArtworks) {
      if (a.original.status === "available" && a.original.saleMode === "buy-now") {
        expect(a.original.price, a.slug).toBeGreaterThan(0);
      }
    }
  });
});
