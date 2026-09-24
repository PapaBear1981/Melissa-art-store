import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtwork, getCollections, getGalleryArtworks, getRelatedArtworks } from "@/lib/data";
import { formatDimensions, formatDimensionsCm } from "@/lib/format";
import { getPrintOptions } from "@/lib/prints";
import { originalShipping } from "@/lib/pricing";
import { Lightbox } from "@/components/art/Lightbox";
import { ArtworkCard } from "@/components/art/ArtworkCard";
import { PurchasePanel } from "@/components/shop/PurchasePanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { container } from "@/components/ui/styles";

export async function generateStaticParams() {
  return (await getGalleryArtworks()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/art/[slug]">): Promise<Metadata> {
  const artwork = await getArtwork((await params).slug);
  if (!artwork) return {};
  return {
    title: artwork.title,
    description: `${artwork.title} (${artwork.year}), ${artwork.medium}, ${formatDimensions(artwork.widthIn, artwork.heightIn)}. ${artwork.description[0] ?? ""}`,
  };
}

export default async function ArtworkPage({ params }: PageProps<"/art/[slug]">) {
  const { slug } = await params;
  const artwork = await getArtwork(slug);
  if (!artwork) notFound();

  const [related, collections] = await Promise.all([getRelatedArtworks(artwork), getCollections()]);
  const inCollections = collections.filter((c) => artwork.collections.includes(c.slug));

  return (
    <>
      <nav aria-label="Breadcrumb" className={`${container} pt-8 text-sm text-muted`}>
        <Link href="/gallery" className="hover:text-terracotta-dark">Gallery</Link> / {artwork.title}
      </nav>

      <div className={`${container} grid gap-12 py-8 lg:grid-cols-12 lg:gap-16`}>
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-24">
            <Lightbox artwork={artwork} />
          </div>
        </div>

        <div className="lg:col-span-5">
          <h1 className="font-display text-4xl sm:text-5xl">{artwork.title}</h1>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            <dt className="text-muted">Year</dt>
            <dd>{artwork.year}</dd>
            <dt className="text-muted">Medium</dt>
            <dd>{artwork.medium}</dd>
            <dt className="text-muted">Size</dt>
            <dd>
              {formatDimensions(artwork.widthIn, artwork.heightIn)}{" "}
              <span className="text-muted">({formatDimensionsCm(artwork.widthIn, artwork.heightIn)})</span>
            </dd>
            {inCollections.length > 0 && (
              <>
                <dt className="text-muted">Collection</dt>
                <dd>
                  {inCollections.map((c, i) => (
                    <span key={c.slug}>
                      {i > 0 && ", "}
                      <Link href={`/collections/${c.slug}`} className="text-teal underline-offset-4 hover:underline">
                        {c.title}
                      </Link>
                    </span>
                  ))}
                </dd>
              </>
            )}
          </dl>

          <div className="mt-6 space-y-3 text-lg leading-relaxed text-ink/85">
            {artwork.description.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <div className="mt-8">
            <PurchasePanel
              artwork={artwork}
              printOptions={getPrintOptions(artwork)}
              shipping={originalShipping(artwork)}
            />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className={`${container} pt-16`}>
          <SectionHeading title="You might also love" />
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((a) => (
              <li key={a.slug}>
                <ArtworkCard artwork={a} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
