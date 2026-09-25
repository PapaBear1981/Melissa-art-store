import { describe, expect, it, vi } from "vitest";

async function loadUrl() {
  vi.resetModules();
  return (await import("./site")).site.url;
}

describe("site.url", () => {
  it("prefers NEXT_PUBLIC_SITE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://melissa.example");
    vi.stubEnv("RENDER_EXTERNAL_URL", "https://melissa.onrender.com");
    expect(await loadUrl()).toBe("https://melissa.example");
  });

  it("falls back to Render's URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("RENDER_EXTERNAL_URL", "https://melissa.onrender.com");
    expect(await loadUrl()).toBe("https://melissa.onrender.com");
  });

  it("falls back to localhost when neither is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("RENDER_EXTERNAL_URL", "");
    expect(await loadUrl()).toBe("http://localhost:3000");
  });
});

describe("site config", () => {
  it("has original shipping tiers in ascending order that end at the quote threshold", async () => {
    const { originalShippingTiers, quoteShippingAboveIn } = await import("./site");
    const sizes = originalShippingTiers.map((t) => t.maxLongestSideIn);
    expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
    expect(sizes.at(-1)).toBe(quoteShippingAboveIn);
  });

  it("lists unique two-letter country codes, excluding the US", async () => {
    const { internationalShippingCountries } = await import("./site");
    expect(new Set(internationalShippingCountries).size).toBe(internationalShippingCountries.length);
    expect(internationalShippingCountries.every((c) => /^[A-Z]{2}$/.test(c))).toBe(true);
    expect(internationalShippingCountries).not.toContain("US");
  });
});
