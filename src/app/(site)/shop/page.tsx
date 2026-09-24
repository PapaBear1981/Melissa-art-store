import type { Metadata } from "next";
import { getShopArtworks } from "@/lib/data";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import { PageHeader } from "@/components/ui/PageHeader";
import { container } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Shop",
  description: "Buy original paintings and fine art prints. Shipping across the US and worldwide.",
};

export default async function ShopPage() {
  const artworks = await getShopArtworks();
  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title="Originals & prints"
        intro="One-of-a-kind paintings from the studio, plus hand-signed fine art prints and canvases."
      />
      <div className={container}>
        <ShopBrowser artworks={artworks} />
      </div>
    </>
  );
}
