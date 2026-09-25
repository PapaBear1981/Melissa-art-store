import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getAllArtworks, getArchiveYears, getCollections } from "@/lib/data";
import { policies } from "@/lib/policies";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artworks, collections, years] = await Promise.all([getAllArtworks(), getCollections(), getArchiveYears()]);
  const pages = ["", "/gallery", "/gallery/archive", "/shop", "/commissions", "/about", "/contact", "/faq"];
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}` })),
    ...collections.map((c) => ({ url: `${site.url}/gallery/${c.slug}` })),
    ...years.map((y) => ({ url: `${site.url}/gallery/archive/${y}` })),
    ...artworks.map((a) => ({ url: `${site.url}/art/${a.slug}` })),
    ...policies.map((p) => ({ url: `${site.url}/policies/${p.slug}` })),
  ];
}
