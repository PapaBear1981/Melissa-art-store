import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Artwork, Collection } from "./types";

const content = vi.hoisted(() => ({
  loadArtworks: vi.fn(),
  loadCollections: vi.fn(),
  loadAbout: vi.fn(),
  loadSiteSettings: vi.fn(),
}));
vi.mock("./content", () => content);

function artwork(slug: string, overrides: Partial<Artwork> = {}): Artwork {
  return {
    slug,
    title: slug,
    year: 2024,
    medium: "Oil",
    widthIn: 20,
    heightIn: 20,
    description: [],
    collections: [],
    original: { status: "sold", saleMode: "buy-now" },
    printsEnabled: false,
    placeholder: { seed: 1, palette: ["#000"], style: "abstract" },
    ...overrides,
  };
}

function collection(slug: string, cover: string): Collection {
  return { slug, title: slug, summary: "", description: [], cover };
}

const artworks = [
  artwork("old-sold", { year: 2021, collections: ["florals"] }),
  artwork("new-original", { year: 2025, collections: ["florals", "big"], original: { status: "available", saleMode: "buy-now", price: 1 } }),
  artwork("mid-prints", { year: 2023, collections: ["big"], printsEnabled: true, featured: true }),
  artwork("mid-inquire", { year: 2024, collections: ["florals"], original: { status: "available", saleMode: "inquire" } }),
];
const collections = [collection("florals", "old-sold"), collection("big", "missing-cover")];

// `cache` memoizes per module instance, so load a fresh copy each test.
let data: typeof import("./data");
beforeEach(async () => {
  content.loadArtworks.mockResolvedValue(artworks);
  content.loadCollections.mockResolvedValue(collections);
  vi.resetModules();
  data = await import("./data");
});

describe("gallery", () => {
  it("lists every artwork newest first without changing the loaded list", async () => {
    expect((await data.getGalleryArtworks()).map((a) => a.slug)).toEqual([
      "new-original",
      "mid-inquire",
      "mid-prints",
      "old-sold",
    ]);
    expect(artworks[0].slug).toBe("old-sold");
  });

  it("finds one artwork by slug", async () => {
    expect((await data.getArtwork("mid-prints"))?.year).toBe(2023);
    expect(await data.getArtwork("nope")).toBeUndefined();
  });
});

describe("shop", () => {
  it("treats only available originals as for sale", () => {
    expect(data.isOriginalForSale(artworks[1])).toBe(true);
    expect(data.isOriginalForSale(artworks[0])).toBe(false);
  });

  it("lists pieces with an available original or prints", async () => {
    expect((await data.getShopArtworks()).map((a) => a.slug)).toEqual(["new-original", "mid-inquire", "mid-prints"]);
  });
});

describe("getFeaturedArtworks", () => {
  it("returns the featured pieces", async () => {
    expect((await data.getFeaturedArtworks()).map((a) => a.slug)).toEqual(["mid-prints"]);
  });

  it("falls back to the three newest pieces when none are featured", async () => {
    content.loadArtworks.mockResolvedValue(artworks.map((a) => ({ ...a, featured: false })));
    expect((await data.getFeaturedArtworks()).map((a) => a.slug)).toEqual(["new-original", "mid-inquire", "mid-prints"]);
  });
});

describe("collections", () => {
  it("lists collections and finds one by slug", async () => {
    expect(await data.getCollections()).toEqual(collections);
    expect((await data.getCollection("big"))?.cover).toBe("missing-cover");
    expect(await data.getCollection("nope")).toBeUndefined();
  });

  it("lists a collection's artworks newest first", async () => {
    expect((await data.getCollectionArtworks("florals")).map((a) => a.slug)).toEqual([
      "new-original",
      "mid-inquire",
      "old-sold",
    ]);
  });

  it("uses the chosen cover painting", async () => {
    expect((await data.getCollectionCover(collections[0]))?.slug).toBe("old-sold");
  });

  it("falls back to the newest painting when the cover is missing", async () => {
    expect((await data.getCollectionCover(collections[1]))?.slug).toBe("new-original");
  });

  it("has no cover for an empty collection with a missing cover", async () => {
    expect(await data.getCollectionCover(collection("empty", "nope"))).toBeUndefined();
  });
});

describe("getRelatedArtworks", () => {
  it("returns other pieces sharing a collection, newest first", async () => {
    expect((await data.getRelatedArtworks(artworks[0])).map((a) => a.slug)).toEqual(["new-original", "mid-inquire"]);
  });

  it("respects the limit", async () => {
    expect((await data.getRelatedArtworks(artworks[1], 2)).map((a) => a.slug)).toEqual(["mid-inquire", "mid-prints"]);
  });

  it("returns nothing for a piece with no collections", async () => {
    expect(await data.getRelatedArtworks(artwork("loner"))).toEqual([]);
  });
});

describe("about and settings", () => {
  it("pass straight through to the content loaders", async () => {
    content.loadAbout.mockResolvedValue({ heading: "Hi" });
    content.loadSiteSettings.mockResolvedValue({ email: "x@example.com" });
    expect(await data.getAbout()).toEqual({ heading: "Hi" });
    expect(await data.getSiteSettings()).toEqual({ email: "x@example.com" });
  });
});
