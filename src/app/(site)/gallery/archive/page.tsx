import type { Metadata } from "next";
import Link from "next/link";
import { getArchiveYear, getArchiveYears } from "@/lib/data";
import { ArchiveThumbnails } from "@/components/art/ArchiveThumbnails";
import { ArchiveYearNav } from "@/components/art/ArchiveYearNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { container } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Archive",
  description: "Every painting, year by year: where Melissa has been, how the work has grown, and where it's heading.",
};

const PREVIEW = 6;

export default async function ArchivePage() {
  const years = await getArchiveYears();
  // Oldest first, so scrolling down reads as the story of the work.
  const byYear = await Promise.all(
    [...years].reverse().map(async (year) => ({ year, artworks: await getArchiveYear(year) })),
  );

  return (
    <>
      <nav aria-label="Breadcrumb" className={`${container} pt-8 text-sm text-muted`}>
        <Link href="/gallery" className="hover:text-terracotta-dark">Gallery</Link> / Archive
      </nav>
      <PageHeader
        eyebrow="Archive"
        title="Year by year"
        intro="Every painting, sorted by the year it was made. Flip through the years to see where the work has been, how it has grown, and where it's heading."
      />
      <div className={container}>
        {years.length > 0 && <div className="mb-12"><ArchiveYearNav years={years} /></div>}
        <div className="space-y-16">
          {byYear.map(({ year, artworks }) => (
            <section key={year} aria-labelledby={`year-${year}`}>
              <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <h2 id={`year-${year}`} className="font-display text-3xl sm:text-4xl">
                  <Link href={`/gallery/archive/${year}`} className="hover:text-terracotta-dark">{year}</Link>
                </h2>
                <Link
                  href={`/gallery/archive/${year}`}
                  className="shrink-0 text-sm font-semibold text-teal underline-offset-4 hover:underline"
                >
                  {artworks.length > PREVIEW
                    ? `See all ${artworks.length} →`
                    : `${artworks.length} ${artworks.length === 1 ? "painting" : "paintings"} →`}
                </Link>
              </div>
              <ArchiveThumbnails artworks={artworks.slice(0, PREVIEW)} />
            </section>
          ))}
        </div>
        {years.length === 0 && <p className="py-16 text-center text-muted">The archive fills up as paintings are added.</p>}
      </div>
    </>
  );
}
