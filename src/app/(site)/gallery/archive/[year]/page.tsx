import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArchiveYear, getArchiveYears } from "@/lib/data";
import { ArchiveThumbnails } from "@/components/art/ArchiveThumbnails";
import { ArchiveYearNav } from "@/components/art/ArchiveYearNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { container } from "@/components/ui/styles";

export async function generateStaticParams() {
  return (await getArchiveYears()).map((y) => ({ year: String(y) }));
}

export async function generateMetadata({ params }: PageProps<"/gallery/archive/[year]">): Promise<Metadata> {
  const { year } = await params;
  return { title: `${year} · Archive`, description: `Paintings Melissa made in ${year}.` };
}

export default async function ArchiveYearPage({ params }: PageProps<"/gallery/archive/[year]">) {
  const year = Number((await params).year);
  const years = await getArchiveYears();
  if (!years.includes(year)) notFound();
  const artworks = await getArchiveYear(year);

  const ascending = [...years].sort((a, b) => a - b);
  const i = ascending.indexOf(year);
  const prev = ascending[i - 1];
  const next = ascending[i + 1];

  return (
    <>
      <nav aria-label="Breadcrumb" className={`${container} pt-8 text-sm text-muted`}>
        <Link href="/gallery" className="hover:text-terracotta-dark">Gallery</Link> /{" "}
        <Link href="/gallery/archive" className="hover:text-terracotta-dark">Archive</Link> / {year}
      </nav>
      <PageHeader
        eyebrow="Archive"
        title={String(year)}
        intro={`${artworks.length} ${artworks.length === 1 ? "painting" : "paintings"} made in ${year}.`}
      />
      <div className={container}>
        <div className="mb-10"><ArchiveYearNav years={years} current={year} /></div>
        <ArchiveThumbnails artworks={artworks} />
        <nav aria-label="Previous and next year" className="mt-16 flex justify-between gap-4 border-t border-line pt-6 text-sm font-semibold">
          {prev ? (
            <Link href={`/gallery/archive/${prev}`} rel="prev" className="text-teal underline-offset-4 hover:underline">← {prev}</Link>
          ) : <span />}
          {next ? (
            <Link href={`/gallery/archive/${next}`} rel="next" className="text-teal underline-offset-4 hover:underline">{next} →</Link>
          ) : <span />}
        </nav>
      </div>
    </>
  );
}
