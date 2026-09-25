import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, fetch, freshFetch, withConfig } = vi.hoisted(() => {
  const freshFetch = vi.fn();
  const withConfig = vi.fn(() => ({ fetch: freshFetch }));
  const fetch = vi.fn();
  return { createClient: vi.fn(() => ({ fetch, withConfig })), fetch, freshFetch, withConfig };
});

vi.mock("next-sanity", () => ({ createClient }));

/** The token and client are set up at import, so each test loads a fresh module. */
async function loadClient(env: { read?: string; write?: string } = {}) {
  vi.resetModules();
  vi.stubEnv("SANITY_API_READ_TOKEN", env.read);
  vi.stubEnv("SANITY_API_WRITE_TOKEN", env.write);
  vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "");
  vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "");
  return import("./client");
}

beforeEach(() => {
  createClient.mockClear();
  fetch.mockReset().mockResolvedValue(["cached"]);
  freshFetch.mockReset().mockResolvedValue(["fresh"]);
});

describe("Sanity read client", () => {
  it("uses the CDN, published content and the read token", async () => {
    await loadClient({ read: "read-tok", write: "write-tok" });
    expect(createClient).toHaveBeenCalledWith({
      projectId: "8ii09o5j",
      dataset: "production",
      apiVersion: "2025-09-01",
      useCdn: true,
      perspective: "published",
      token: "read-tok",
    });
  });

  it("falls back to the write token when there's no read token", async () => {
    await loadClient({ write: "write-tok" });
    expect(createClient).toHaveBeenCalledWith(expect.objectContaining({ token: "write-tok" }));
  });

  it("has no token when neither is set", async () => {
    await loadClient();
    expect(createClient).toHaveBeenCalledWith(expect.objectContaining({ token: undefined }));
  });
});

describe("sanityFetch", () => {
  it("caches for 60 seconds under the sanity tag", async () => {
    const { sanityFetch, SANITY_TAG } = await loadClient();
    expect(SANITY_TAG).toBe("sanity");
    expect(await sanityFetch("*[_type == $t]", { t: "artwork" })).toEqual(["cached"]);
    expect(fetch).toHaveBeenCalledWith("*[_type == $t]", { t: "artwork" }, { next: { revalidate: 60, tags: ["sanity"] } });
  });

  it("defaults to no query params", async () => {
    const { sanityFetch } = await loadClient();
    await sanityFetch("*");
    expect(fetch).toHaveBeenCalledWith("*", {}, expect.any(Object));
  });
});

describe("sanityFetchFresh", () => {
  it("bypasses the CDN and the Next.js cache", async () => {
    const { sanityFetchFresh } = await loadClient();
    expect(await sanityFetchFresh("*[slug in $s]", { s: ["a"] })).toEqual(["fresh"]);
    expect(withConfig).toHaveBeenCalledWith({ useCdn: false });
    expect(freshFetch).toHaveBeenCalledWith("*[slug in $s]", { s: ["a"] }, { cache: "no-store" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("defaults to no query params", async () => {
    const { sanityFetchFresh } = await loadClient();
    await sanityFetchFresh("*");
    expect(freshFetch).toHaveBeenCalledWith("*", {}, { cache: "no-store" });
  });
});
