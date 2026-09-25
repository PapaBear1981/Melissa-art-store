import { beforeEach, describe, expect, it, vi } from "vitest";
import { site } from "@/config/site";
import { aboutPageQuery, artworksBySlugQuery, artworksQuery, collectionsQuery, siteSettingsQuery } from "@/sanity/queries";
import { placeholderFor } from "./placeholder";
import { sampleArtworks, sampleCollections } from "./sample-data";

const { sanityFetch, sanityFetchFresh } = vi.hoisted(() => ({
  sanityFetch: vi.fn(),
  sanityFetchFresh: vi.fn(),
}));

vi.mock("@/sanity/client", () => ({ sanityFetch, sanityFetchFresh }));

/** `useSample` is read once at import, so each mode needs a fresh module. */
async function loadContent(sample: boolean) {
  vi.resetModules();
  vi.stubEnv("USE_SAMPLE_CONTENT", sample ? "true" : "false");
  return import("./content");
}

beforeEach(() => {
  sanityFetch.mockReset();
  sanityFetchFresh.mockReset();
});

describe("paragraphs", () => {
  it("splits text at blank lines and trims each paragraph", async () => {
    const { paragraphs } = await loadContent(false);
    expect(paragraphs("  First line\nstill first  \n\n  Second \n   \n\nThird")).toEqual([
      "First line\nstill first",
      "Second",
      "Third",
    ]);
  });

  it("returns an empty list for missing or blank text", async () => {
    const { paragraphs } = await loadContent(false);
    expect(paragraphs()).toEqual([]);
    expect(paragraphs(null)).toEqual([]);
    expect(paragraphs("   \n\n  ")).toEqual([]);
  });
});

describe("with sample content", () => {
  it("returns the sample artworks without asking Sanity", async () => {
    const { loadArtworks } = await loadContent(true);
    expect(await loadArtworks()).toEqual(sampleArtworks.filter((a) => !a.hidden));
    expect(sanityFetch).not.toHaveBeenCalled();
  });

  it("returns only the requested sample artworks for checkout", async () => {
    const { loadArtworksFresh } = await loadContent(true);
    const slugs = [sampleArtworks[0].slug, sampleArtworks[2].slug, "no-such-painting"];
    const result = await loadArtworksFresh(slugs);
    expect(result.map((a) => a.slug)).toEqual([sampleArtworks[0].slug, sampleArtworks[2].slug]);
    expect(sanityFetchFresh).not.toHaveBeenCalled();
  });

  it("returns the sample collections", async () => {
    const { loadCollections } = await loadContent(true);
    expect(await loadCollections()).toEqual(sampleCollections);
  });

  it("returns the default About text", async () => {
    const { loadAbout } = await loadContent(true);
    const about = await loadAbout();
    expect(about.intro).toHaveLength(2);
    expect(about.milestones[0].year).toBe("2025");
    expect(about.heading).toBe("Hi, I'm Melissa.");
    expect(about.statementTitle).toBe("Artist statement");
    expect(about.buttons).toEqual([
      { label: "See the work", link: "/gallery" },
      { label: "Commission a painting", link: "/commissions" },
    ]);
    expect(about.portrait).toBeUndefined();
    expect(sanityFetch).not.toHaveBeenCalled();
  });

  it("returns the site config contact details", async () => {
    const { loadSiteSettings } = await loadContent(true);
    expect(await loadSiteSettings()).toEqual({
      email: site.email,
      location: site.location,
      instagram: site.social.instagram,
      facebook: site.social.facebook,
    });
    expect(sanityFetch).not.toHaveBeenCalled();
  });
});

describe("loadArtworks from Sanity", () => {
  it("converts a fully filled-in painting, turning dollars into cents", async () => {
    const { loadArtworks } = await loadContent(false);
    sanityFetch.mockResolvedValue([
      {
        slug: "sunset",
        title: "Sunset",
        year: 2023,
        medium: "Oil on canvas",
        widthIn: 30,
        heightIn: 40,
        description: "One.\n\nTwo.",
        featured: true,
        status: "sold",
        saleMode: "inquire",
        price: 1850.5,
        shipping: { us: 120, intl: 0 },
        printsEnabled: true,
        collections: ["warm", null, "big"],
        image: { url: "https://cdn.sanity.io/x.jpg", width: 2000, height: 1500, alt: "Orange sky", lqip: "data:lqip" },
      },
    ]);

    const [art] = await loadArtworks();

    expect(sanityFetch).toHaveBeenCalledWith(artworksQuery);
    expect(art).toEqual({
      slug: "sunset",
      title: "Sunset",
      year: 2023,
      medium: "Oil on canvas",
      widthIn: 30,
      heightIn: 40,
      description: ["One.", "Two."],
      collections: ["warm", "big"],
      featured: true,
      original: {
        status: "sold",
        saleMode: "inquire",
        price: 185050,
        shipping: { us: 12000, intl: 0 },
      },
      printsEnabled: true,
      image: { src: "https://cdn.sanity.io/x.jpg", width: 2000, height: 1500, alt: "Orange sky", lqip: "data:lqip" },
      placeholder: placeholderFor("sunset"),
    });
  });

  it("fills in defaults for a painting with only a slug", async () => {
    const { loadArtworks } = await loadContent(false);
    sanityFetch.mockResolvedValue([{ slug: "bare" }]);

    const [art] = await loadArtworks();

    expect(art).toEqual({
      slug: "bare",
      title: "Untitled",
      year: new Date().getFullYear(),
      medium: "",
      widthIn: 24,
      heightIn: 24,
      description: [],
      collections: [],
      featured: false,
      original: { status: "available", saleMode: "buy-now", price: undefined, shipping: undefined },
      printsEnabled: false,
      image: undefined,
      placeholder: placeholderFor("bare"),
    });
  });

  it("treats a zero price and zero size as missing", async () => {
    const { loadArtworks } = await loadContent(false);
    sanityFetch.mockResolvedValue([{ slug: "zero", price: 0, widthIn: 0, heightIn: 0, collections: null }]);
    const [art] = await loadArtworks();
    expect(art.original.price).toBeUndefined();
    expect(art.widthIn).toBe(24);
    expect(art.heightIn).toBe(24);
    expect(art.collections).toEqual([]);
  });

  it("ignores a shipping override unless both US and international are set", async () => {
    const { loadArtworks } = await loadContent(false);
    sanityFetch.mockResolvedValue([
      { slug: "us-only", shipping: { us: 50 } },
      { slug: "intl-only", shipping: { intl: 90 } },
      { slug: "null-shipping", shipping: null },
    ]);
    const arts = await loadArtworks();
    expect(arts.map((a) => a.original.shipping)).toEqual([undefined, undefined, undefined]);
  });

  it("drops images that are missing a url, width or height", async () => {
    const { loadArtworks } = await loadContent(false);
    const full = { url: "https://cdn.sanity.io/a.jpg", width: 10, height: 20 };
    sanityFetch.mockResolvedValue([
      { slug: "a", image: { ...full, url: undefined } },
      { slug: "b", image: { ...full, width: undefined } },
      { slug: "c", image: { ...full, height: 0 } },
      { slug: "d", image: null },
    ]);
    const arts = await loadArtworks();
    expect(arts.map((a) => a.image)).toEqual([undefined, undefined, undefined, undefined]);
  });

  it("uses the title as alt text when the image has none", async () => {
    const { loadArtworks } = await loadContent(false);
    sanityFetch.mockResolvedValue([
      { slug: "a", title: "Peonies", image: { url: "https://cdn.sanity.io/a.jpg", width: 10, height: 20, alt: "" } },
    ]);
    const [art] = await loadArtworks();
    expect(art.image).toEqual({ src: "https://cdn.sanity.io/a.jpg", width: 10, height: 20, alt: "Peonies", lqip: undefined });
  });
});

describe("loadArtworksFresh from Sanity", () => {
  it("queries by slug without the cache and converts the results", async () => {
    const { loadArtworksFresh } = await loadContent(false);
    sanityFetchFresh.mockResolvedValue([{ slug: "a", price: 100 }]);
    const arts = await loadArtworksFresh(["a", "b"]);
    expect(sanityFetchFresh).toHaveBeenCalledWith(artworksBySlugQuery, { slugs: ["a", "b"] });
    expect(arts).toHaveLength(1);
    expect(arts[0].original.price).toBe(10000);
  });
});

describe("loadCollections from Sanity", () => {
  it("converts collections and fills in defaults", async () => {
    const { loadCollections } = await loadContent(false);
    sanityFetch.mockResolvedValue([
      { slug: "full", title: "Full", summary: "Short", description: "P1\n\nP2", cover: "sunset" },
      { slug: "empty", cover: null },
    ]);
    expect(await loadCollections()).toEqual([
      { slug: "full", title: "Full", summary: "Short", description: ["P1", "P2"], cover: "sunset" },
      { slug: "empty", title: "Untitled collection", summary: "", description: [], cover: "" },
    ]);
    expect(sanityFetch).toHaveBeenCalledWith(collectionsQuery);
  });
});

describe("loadAbout from Sanity", () => {
  it("falls back to the default About content when the page doesn't exist", async () => {
    const { loadAbout } = await loadContent(true);
    const defaults = await loadAbout();
    const { loadAbout: loadLive } = await loadContent(false);
    sanityFetch.mockResolvedValue(null);
    expect(await loadLive()).toEqual(defaults);
    expect(sanityFetch).toHaveBeenCalledWith(aboutPageQuery);
  });

  it("uses dashboard text where given and defaults where empty", async () => {
    const { loadAbout: loadDefaults } = await loadContent(true);
    const defaults = await loadDefaults();
    const { loadAbout } = await loadContent(false);
    sanityFetch.mockResolvedValue({ intro: "Hello.\n\nIt's me.", statement: "", milestones: null });

    const about = await loadAbout();

    expect(about.intro).toEqual(["Hello.", "It's me."]);
    expect(about.statement).toEqual(defaults.statement);
    expect(about.studio).toEqual(defaults.studio);
    expect(about.milestones).toEqual(defaults.milestones);
    expect(about.portrait).toBeUndefined();
  });

  it("drops milestones without text and defaults a missing year to blank", async () => {
    const { loadAbout } = await loadContent(false);
    sanityFetch.mockResolvedValue({
      studio: "Studio text",
      milestones: [{ year: "2020", text: "Show" }, { year: "2021" }, { text: "Undated news" }, { year: "2022", text: "" }],
    });
    const about = await loadAbout();
    expect(about.studio).toEqual(["Studio text"]);
    expect(about.milestones).toEqual([
      { year: "2020", text: "Show" },
      { year: "", text: "Undated news" },
    ]);
  });

  it("uses the headings, buttons and search description from the dashboard", async () => {
    const { loadAbout } = await loadContent(false);
    sanityFetch.mockResolvedValue({
      heading: "Welcome to my studio",
      seoDescription: "Colorful paintings from Asheville.",
      statementTitle: "Why I paint",
      studioTitle: "  How I work ",
      milestonesTitle: "Shows",
      buttons: [{ label: "Shop prints", link: "/shop" }, { label: "Say hello", link: "/contact" }],
    });
    const about = await loadAbout();
    expect(about).toMatchObject({
      heading: "Welcome to my studio",
      seoDescription: "Colorful paintings from Asheville.",
      statementTitle: "Why I paint",
      studioTitle: "How I work",
      milestonesTitle: "Shows",
      buttons: [{ label: "Shop prints", link: "/shop" }, { label: "Say hello", link: "/contact" }],
    });
  });

  it("falls back to the default headings and buttons when they're blank", async () => {
    const { loadAbout: loadDefaults } = await loadContent(true);
    const defaults = await loadDefaults();
    const { loadAbout } = await loadContent(false);
    sanityFetch.mockResolvedValue({ heading: "  ", statementTitle: "", buttons: [{ label: "No link" }, { link: "/shop" }] });
    const about = await loadAbout();
    expect(about.heading).toBe(defaults.heading);
    expect(about.statementTitle).toBe(defaults.statementTitle);
    expect(about.seoDescription).toBe(defaults.seoDescription);
    expect(about.buttons).toEqual(defaults.buttons);
  });

  it("shows at most two buttons", async () => {
    const { loadAbout } = await loadContent(false);
    sanityFetch.mockResolvedValue({
      buttons: [{ label: "A", link: "/a" }, { label: "B", link: "/b" }, { label: "C", link: "/c" }],
    });
    expect((await loadAbout()).buttons.map((b) => b.label)).toEqual(["A", "B"]);
  });

  it("keeps an empty milestones list instead of showing the sample ones", async () => {
    const { loadAbout } = await loadContent(false);
    sanityFetch.mockResolvedValue({ milestones: [] });
    expect((await loadAbout()).milestones).toEqual([]);
  });

  it("gives the portrait default alt text naming the artist", async () => {
    const { loadAbout } = await loadContent(false);
    sanityFetch.mockResolvedValue({ portrait: { url: "https://cdn.sanity.io/me.jpg", width: 800, height: 1000 } });
    expect((await loadAbout()).portrait).toEqual({
      src: "https://cdn.sanity.io/me.jpg",
      width: 800,
      height: 1000,
      alt: `Portrait of ${site.artistName}`,
      lqip: undefined,
    });
  });
});

describe("loadSiteSettings from Sanity", () => {
  it("uses the dashboard contact details", async () => {
    const { loadSiteSettings } = await loadContent(false);
    const settings = { email: "m@art.test", location: "Asheville", instagram: "https://ig/m", facebook: "https://fb/m" };
    sanityFetch.mockResolvedValue(settings);
    expect(await loadSiteSettings()).toEqual(settings);
    expect(sanityFetch).toHaveBeenCalledWith(siteSettingsQuery);
  });

  it("falls back to the site config for empty fields", async () => {
    const { loadSiteSettings } = await loadContent(false);
    sanityFetch.mockResolvedValue({ email: "", location: "Asheville" });
    expect(await loadSiteSettings()).toEqual({
      email: site.email,
      location: "Asheville",
      instagram: site.social.instagram,
      facebook: site.social.facebook,
    });
  });

  it("falls back to the site config when the settings document doesn't exist", async () => {
    const { loadSiteSettings } = await loadContent(false);
    sanityFetch.mockResolvedValue(null);
    expect(await loadSiteSettings()).toEqual({
      email: site.email,
      location: site.location,
      instagram: site.social.instagram,
      facebook: site.social.facebook,
    });
  });
});
