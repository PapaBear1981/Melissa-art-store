import type { Metadata } from "next";
import Link from "next/link";
import { getCollectionArtworks, getCollectionCover, getCollections } from "@/lib/data";
import { ArtworkImage } from "@/components/art/ArtworkImage";
import { PageHeader } from "@/components/ui/PageHeader";
import { container } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Collections",
  description: "Paintings grouped into series and themes.",
};

export default async function CollectionsPage() {
  const collections = await getCollections();
  const details = await Promise.all(
    collections.map(async (c) => ({
      collection: c,
      cover: await getCollectionCover(c),
      count: (await getCollectionArtworks(c.slug)).length,
    })),
  );

  return (
    <>
      <PageHeader eyebrow="Series" title="Collections" intro="Bodies of work that belong together." />
      <ul className={`${container} grid gap-10 md:grid-cols-2`}>
        {details.map(({ collection: c, cover, count }) => (
          <li key={c.slug}>
            <Link href={`/collections/${c.slug}`} className="group block">
              <div className="aspect-[3/2] overflow-hidden rounded-2xl">
                {cover && (
                  <div className="h-full w-full transition duration-500 group-hover:scale-105">
                    <ArtworkImage artwork={cover} fit="fill" sizes="(min-width: 768px) 50vw, 100vw" />
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-4">
                <h2 className="font-display text-3xl group-hover:text-terracotta-dark">{c.title}</h2>
                <span className="text-sm text-muted">{count} {count === 1 ? "painting" : "paintings"}</span>
              </div>
              <p className="mt-1 text-muted">{c.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
