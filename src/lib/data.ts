import { cache } from "react";
import { loadAbout, loadArtworks, loadCollections, loadSiteSettings } from "./content";
import type { Artwork, Collection } from "./types";

/**
 * Data access layer. Every page reads content through these functions.
 * Content comes from the Sanity dashboard (see ./content.ts).
 */

const allArtworks = cache(loadArtworks);
const allCollections = cache(loadCollections);

export const getAbout = cache(loadAbout);
export const getSiteSettings = cache(loadSiteSettings);

/** Every painting, archived ones included, newest first. */
async function everyArtwork(): Promise<Artwork[]> {
  return [...(await allArtworks())].sort((a, b) => b.year - a.year);
}

/** Current work: everything except pieces moved to the Archive. */
export async function getGalleryArtworks(): Promise<Artwork[]> {
  return (await everyArtwork()).filter((a) => !a.archived);
}

/** Every painting with its own page, archived ones included. */
export const getAllArtworks = everyArtwork;

/** Years that have at least one painting, newest first. */
export async function getArchiveYears(): Promise<number[]> {
  return [...new Set((await everyArtwork()).map((a) => a.year))];
}

/** Everything painted in a given year, current and archived. */
export async function getArchiveYear(year: number): Promise<Artwork[]> {
  return (await everyArtwork()).filter((a) => a.year === year);
}

export async function getArtwork(slug: string): Promise<Artwork | undefined> {
  return (await allArtworks()).find((a) => a.slug === slug);
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
  const all = await getGalleryArtworks();
  const featured = all.filter((a) => a.featured);
  // Fall back to the newest work so the home page is never empty.
  return featured.length ? featured : all.slice(0, 3);
}

export async function getCollections(): Promise<Collection[]> {
  return allCollections();
}

export async function getCollection(
  slug: string,
): Promise<Collection | undefined> {
  return (await allCollections()).find((c) => c.slug === slug);
}

export async function getCollectionArtworks(slug: string): Promise<Artwork[]> {
  return (await getGalleryArtworks()).filter((a) =>
    a.collections.includes(slug),
  );
}

/** Cover painting for a collection: the chosen cover, or its newest painting. */
export async function getCollectionCover(
  collection: Collection,
): Promise<Artwork | undefined> {
  return (
    (await getArtwork(collection.cover)) ??
    (await getCollectionArtworks(collection.slug))[0]
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

/** Cover for the Archive card: the newest archived piece, else the oldest painting. */
export async function getArchiveCover(): Promise<Artwork | undefined> {
  const all = await everyArtwork();
  return all.find((a) => a.archived) ?? all.at(-1);
}
