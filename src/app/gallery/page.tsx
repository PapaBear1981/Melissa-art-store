import type { Metadata } from "next";
import { getCollections, getGalleryArtworks } from "@/lib/data";
import { GalleryBrowser } from "@/components/art/GalleryBrowser";
import { PageHeader } from "@/components/ui/PageHeader";
import { container } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Gallery",
  description: "A portfolio of Melissa's paintings: landscapes, florals and abstracts.",
};

export default async function GalleryPage() {
  const [artworks, collections] = await Promise.all([getGalleryArtworks(), getCollections()]);
  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title="Gallery"
        intro="A look at the work, past and present. Some originals have found homes, but many are still available as prints."
      />
      <div className={container}>
        <GalleryBrowser artworks={artworks} collections={collections} />
      </div>
    </>
  );
}
