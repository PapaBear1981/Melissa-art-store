import { describe, expect, it, vi } from "vitest";
import { site } from "@/config/site";
import { policies } from "@/lib/policies";
import sitemap from "./sitemap";

vi.mock("@/lib/data", () => ({
  getGalleryArtworks: vi.fn(async () => [{ slug: "sunset" }, { slug: "meadow" }]),
  getCollections: vi.fn(async () => [{ slug: "warm" }]),
}));

describe("sitemap", () => {
  it("lists the static pages, then collections, artworks and policies", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toEqual([
      site.url,
      `${site.url}/gallery`,
      `${site.url}/collections`,
      `${site.url}/shop`,
      `${site.url}/commissions`,
      `${site.url}/about`,
      `${site.url}/contact`,
      `${site.url}/faq`,
      `${site.url}/collections/warm`,
      `${site.url}/art/sunset`,
      `${site.url}/art/meadow`,
      ...policies.map((p) => `${site.url}/policies/${p.slug}`),
    ]);
    expect(policies.length).toBeGreaterThan(0);
  });
});
