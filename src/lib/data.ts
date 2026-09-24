import { sampleArtworks, sampleCollections } from "./sample-data";
import type { Artwork, Collection } from "./types";

/**
 * Data access layer. Every page reads content through these functions, so
 * swapping the sample data for the content dashboard (Sanity) only touches
 * this file.
 */

const visible = () => sampleArtworks.filter((a) => !a.hidden);

export async function getGalleryArtworks(): Promise<Artwork[]> {
  return visible().sort((a, b) => b.year - a.year);
}

export async function getArtwork(slug: string): Promise<Artwork | undefined> {
  return visible().find((a) => a.slug === slug);
}

export function isOriginalForSale(a: Artwork): boolean {
  return a.original.status === "available";
}

/** Anything a customer can buy: an available original or prints. */
export async function getShopArtworks(): Promise<Artwork[]> {
  return (await getGalleryArtworks()).filter(
    (a) => isOriginalForSale(a) || a.printsEnabled,
  );
}

export async function getFeaturedArtworks(): Promise<Artwork[]> {
  return (await getGalleryArtworks()).filter((a) => a.featured);
}

export async function getCollections(): Promise<Collection[]> {
  return sampleCollections;
}

export async function getCollection(
  slug: string,
): Promise<Collection | undefined> {
  return sampleCollections.find((c) => c.slug === slug);
}

export async function getCollectionArtworks(slug: string): Promise<Artwork[]> {
  return (await getGalleryArtworks()).filter((a) =>
    a.collections.includes(slug),
  );
}

export async function getRelatedArtworks(
  artwork: Artwork,
  limit = 4,
): Promise<Artwork[]> {
  return (await getGalleryArtworks())
    .filter(
      (a) =>
        a.slug !== artwork.slug &&
        a.collections.some((c) => artwork.collections.includes(c)),
    )
    .slice(0, limit);
}
