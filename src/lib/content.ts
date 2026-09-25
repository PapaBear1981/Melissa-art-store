import "server-only";
import { site } from "@/config/site";
import { sanityFetch, sanityFetchFresh } from "@/sanity/client";
import { aboutPageQuery, artworksBySlugQuery, artworksQuery, collectionsQuery, siteSettingsQuery } from "@/sanity/queries";
import { placeholderFor } from "./placeholder";
import { sampleArtworks, sampleCollections } from "./sample-data";
import type { ArtImage, Artwork, Collection, OriginalStatus, SaleMode } from "./types";

/**
 * Loads content from Sanity. Set USE_SAMPLE_CONTENT=true to use the
 * built-in sample paintings instead (handy for working offline).
 */
const useSample = process.env.USE_SAMPLE_CONTENT === "true";

type SanityImage = { alt?: string; url?: string; width?: number; height?: number; lqip?: string } | null;

type SanityArtwork = {
  slug: string;
  title?: string;
  year?: number;
  medium?: string;
  widthIn?: number;
  heightIn?: number;
  description?: string;
  featured?: boolean;
  status?: OriginalStatus;
  saleMode?: SaleMode;
  price?: number;
  shipping?: { us?: number; intl?: number } | null;
  printsEnabled?: boolean;
  collections?: (string | null)[] | null;
  image?: SanityImage;
};

type SanityCollection = {
  slug: string;
  title?: string;
  summary?: string;
  description?: string;
  cover?: string | null;
};

const dollarsToCents = (n: number) => Math.round(n * 100);

/** Split text typed in the dashboard into paragraphs at blank lines. */
export const paragraphs = (text?: string | null) =>
  (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

function toImage(img: SanityImage | undefined, fallbackAlt: string): ArtImage | undefined {
  if (!img?.url || !img.width || !img.height) return undefined;
  return { src: img.url, width: img.width, height: img.height, alt: img.alt || fallbackAlt, lqip: img.lqip };
}

function toArtwork(d: SanityArtwork): Artwork {
  const title = d.title ?? "Untitled";
  const hasShipping = d.shipping?.us != null && d.shipping?.intl != null;
  return {
    slug: d.slug,
    title,
    year: d.year ?? new Date().getFullYear(),
    medium: d.medium ?? "",
    widthIn: d.widthIn || 24,
    heightIn: d.heightIn || 24,
    description: paragraphs(d.description),
    collections: (d.collections ?? []).filter((c): c is string => Boolean(c)),
    featured: d.featured ?? false,
    original: {
      status: d.status ?? "available",
      saleMode: d.saleMode ?? "buy-now",
      price: d.price ? dollarsToCents(d.price) : undefined,
      shipping: hasShipping
        ? { us: dollarsToCents(d.shipping!.us!), intl: dollarsToCents(d.shipping!.intl!) }
        : undefined,
    },
    printsEnabled: d.printsEnabled ?? false,
    image: toImage(d.image, title),
    placeholder: placeholderFor(d.slug),
  };
}

export async function loadArtworks(): Promise<Artwork[]> {
  if (useSample) return sampleArtworks.filter((a) => !a.hidden);
  const docs = await sanityFetch<SanityArtwork[]>(artworksQuery);
  return docs.map(toArtwork);
}

/** Up-to-the-second artwork data (no caching), used at checkout. */
export async function loadArtworksFresh(slugs: string[]): Promise<Artwork[]> {
  if (useSample) return sampleArtworks.filter((a) => slugs.includes(a.slug));
  const docs = await sanityFetchFresh<SanityArtwork[]>(artworksBySlugQuery, { slugs });
  return docs.map(toArtwork);
}

export async function loadCollections(): Promise<Collection[]> {
  if (useSample) return sampleCollections;
  const docs = await sanityFetch<SanityCollection[]>(collectionsQuery);
  return docs.map((d) => ({
    slug: d.slug,
    title: d.title ?? "Untitled collection",
    summary: d.summary ?? "",
    description: paragraphs(d.description),
    cover: d.cover ?? "",
  }));
}

export interface AboutContent {
  heading: string;
  seoDescription: string;
  intro: string[];
  statementTitle: string;
  statement: string[];
  studioTitle: string;
  studio: string[];
  milestonesTitle: string;
  milestones: { year: string; text: string }[];
  buttons: { label: string; link: string }[];
  portrait?: ArtImage;
}

// SAMPLE CONTENT — shown until the About page is filled in on the dashboard.
const defaultAbout: AboutContent = {
  heading: `Hi, I'm ${site.artistName}.`,
  seoDescription: `Meet ${site.artistName}, the painter behind ${site.name}.`,
  statementTitle: "Artist statement",
  studioTitle: "In the studio",
  milestonesTitle: "Exhibitions & news",
  buttons: [
    { label: "See the work", link: "/gallery" },
    { label: "Commission a painting", link: "/commissions" },
  ],
  intro: [
    "I'm a painter who can't stay away from color. My work moves between landscapes, loose florals and pure abstraction, but it always starts with the same thing: a feeling of warmth I want to hold onto.",
    "Most of my paintings are made in acrylic and oil, sometimes with oil pastel worked into the top layers. I paint everything from small 12-inch studies to five-foot canvases that fill a wall.",
  ],
  statement: [
    "I paint to slow down. Late afternoon light, a jar of garden flowers, the way a warm orange buzzes next to a deep teal. These everyday moments are what I want people to live with. My hope is that each painting brings a little more light into the room it hangs in.",
  ],
  studio: [
    "Every original is signed, varnished and ready to hang, and ships with a certificate of authenticity. Prints are made from professional high-resolution scans of the originals so the colors stay true.",
  ],
  milestones: [
    { year: "2025", text: "Solo exhibition (example): Sample Gallery, Your City" },
    { year: "2024", text: "Group show (example): Local Art Center" },
  ],
};

export async function loadAbout(): Promise<AboutContent> {
  if (useSample) return defaultAbout;
  const d = await sanityFetch<{
    heading?: string;
    seoDescription?: string;
    intro?: string;
    statementTitle?: string;
    statement?: string;
    studioTitle?: string;
    studio?: string;
    milestonesTitle?: string;
    milestones?: { year?: string; text?: string }[] | null;
    buttons?: { label?: string; link?: string }[] | null;
    portrait?: SanityImage;
  } | null>(aboutPageQuery);
  if (!d) return defaultAbout;
  const or = (text: string | undefined, fallback: string[]) => (text ? paragraphs(text) : fallback);
  const line = (text: string | undefined, fallback: string) => text?.trim() || fallback;
  const buttons = (d.buttons ?? [])
    .filter((b) => b.label?.trim() && b.link?.trim())
    .map((b) => ({ label: b.label!.trim(), link: b.link!.trim() }));
  return {
    heading: line(d.heading, defaultAbout.heading),
    seoDescription: line(d.seoDescription, defaultAbout.seoDescription),
    statementTitle: line(d.statementTitle, defaultAbout.statementTitle),
    studioTitle: line(d.studioTitle, defaultAbout.studioTitle),
    milestonesTitle: line(d.milestonesTitle, defaultAbout.milestonesTitle),
    buttons: buttons.length ? buttons.slice(0, 2) : defaultAbout.buttons,
    intro: or(d.intro, defaultAbout.intro),
    statement: or(d.statement, defaultAbout.statement),
    studio: or(d.studio, defaultAbout.studio),
    milestones: d.milestones
      ? d.milestones.filter((m) => m.text).map((m) => ({ year: m.year ?? "", text: m.text! }))
      : defaultAbout.milestones,
    portrait: toImage(d.portrait, `Portrait of ${site.artistName}`),
  };
}

export interface SiteSettings {
  email: string;
  location: string;
  instagram?: string;
  facebook?: string;
}

export async function loadSiteSettings(): Promise<SiteSettings> {
  const defaults: SiteSettings = {
    email: site.email,
    location: site.location,
    instagram: site.social.instagram,
    facebook: site.social.facebook,
  };
  if (useSample) return defaults;
  const d = await sanityFetch<Partial<SiteSettings> | null>(siteSettingsQuery);
  return {
    email: d?.email || defaults.email,
    location: d?.location || defaults.location,
    instagram: d?.instagram || defaults.instagram,
    facebook: d?.facebook || defaults.facebook,
  };
}
