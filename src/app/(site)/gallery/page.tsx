import type { Metadata } from "next";
import Link from "next/link";
import {
  getArchiveCover,
  getArchiveYears,
  getCollectionArtworks,
  getCollectionCover,
  getCollections,
  getGalleryArtworks,
} from "@/lib/data";
import { ArtworkImage } from "@/components/art/ArtworkImage";
import { GalleryBrowser } from "@/components/art/GalleryBrowser";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { container } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Gallery",
  description: "A portfolio of Melissa's paintings: landscapes, florals and abstracts, grouped into collections.",
};

export default async function GalleryPage() {
  const [artworks, collections, archiveYears, archiveCover] = await Promise.all([
    getGalleryArtworks(),
    getCollections(),
    getArchiveYears(),
    getArchiveCover(),
  ]);
  const details = await Promise.all(
    collections.map(async (c) => ({
      collection: c,
      cover: await getCollectionCover(c),
      count: (await getCollectionArtworks(c.slug)).length,
    })),
  );

  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title="Gallery"
        intro="A look at the work, past and present. Some originals have found homes, but many are still available as prints."
      />

      {(details.length > 0 || archiveYears.length > 0) && (
        <section id="collections" className={`${container} scroll-mt-24 pb-16`}>
          <SectionHeading title="Collections" />
          <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {details.map(({ collection: c, cover, count }) => (
              <li key={c.slug}>
                <Link href={`/gallery/${c.slug}`} className="group block">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl">
                    {cover && (
                      <div className="h-full w-full transition duration-500 group-hover:scale-105">
                        <ArtworkImage artwork={cover} fit="fill" sizes="(min-width: 1024px) 25vw, 50vw" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-xl group-hover:text-terracotta-dark sm:text-2xl">{c.title}</h3>
                    <span className="shrink-0 text-sm text-muted">{count} {count === 1 ? "painting" : "paintings"}</span>
                  </div>
                  <p className="text-sm text-muted">{c.summary}</p>
                </Link>
              </li>
            ))}
            {archiveYears.length > 0 && (
              <li>
                <Link href="/gallery/archive" className="group block">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl">
                    {archiveCover && (
                      <div className="h-full w-full grayscale-[35%] transition duration-500 group-hover:scale-105 group-hover:grayscale-0">
                        <ArtworkImage artwork={archiveCover} fit="fill" sizes="(min-width: 1024px) 25vw, 50vw" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-xl group-hover:text-terracotta-dark sm:text-2xl">Archive</h3>
                    <span className="shrink-0 text-sm text-muted">
                      {archiveYears.length === 1 ? archiveYears[0] : `${archiveYears.at(-1)}–${archiveYears[0]}`}
                    </span>
                  </div>
                  <p className="text-sm text-muted">Every painting, year by year.</p>
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <section id="all-work" className={`${container} scroll-mt-24`}>
        <SectionHeading title="All work" color="text-terracotta" />
        <GalleryBrowser artworks={artworks} collections={collections} />
      </section>
    </>
  );
}
