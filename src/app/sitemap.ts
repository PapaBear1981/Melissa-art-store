import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getCollections, getGalleryArtworks } from "@/lib/data";
import { policies } from "@/lib/policies";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artworks, collections] = await Promise.all([getGalleryArtworks(), getCollections()]);
  const pages = ["", "/gallery", "/shop", "/commissions", "/about", "/contact", "/faq"];
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}` })),
    ...collections.map((c) => ({ url: `${site.url}/gallery/${c.slug}` })),
    ...artworks.map((a) => ({ url: `${site.url}/art/${a.slug}` })),
    ...policies.map((p) => ({ url: `${site.url}/policies/${p.slug}` })),
  ];
}
