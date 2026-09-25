import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection, getCollectionArtworks, getCollections } from "@/lib/data";
import { ArtworkGrid } from "@/components/art/ArtworkGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { container } from "@/components/ui/styles";

export async function generateStaticParams() {
  return (await getCollections()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const collection = await getCollection((await params).slug);
  return collection ? { title: collection.title, description: collection.summary } : {};
}

export default async function CollectionPage({ params }: PageProps<"/gallery/[slug]">) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();
  const artworks = await getCollectionArtworks(slug);

  return (
    <>
      <nav aria-label="Breadcrumb" className={`${container} pt-8 text-sm text-muted`}>
        <Link href="/gallery" className="hover:text-terracotta-dark">Gallery</Link> / {collection.title}
      </nav>
      <PageHeader
        eyebrow="Collection"
        title={collection.title}
        intro={collection.description.map((p) => <p key={p} className="mb-2">{p}</p>)}
      />
      <div className={container}>
        <ArtworkGrid artworks={artworks} />
      </div>
    </>
  );
}
