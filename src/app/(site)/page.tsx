import { mainNav, site } from "@/config/site";
import { getAbout, getCollectionCover, getCollections, getFeaturedArtworks, getGalleryArtworks, getShopArtworks, isOriginalForSale } from "@/lib/data";
import type { Artwork } from "@/lib/types";
import { PageSlideshow, type Slide } from "@/components/home/PageSlideshow";

type SlideCopy = Omit<Slide, "href" | "label" | "artwork" | "photo">;

// One slide per page in the menu, in menu order.
const copy: Record<(typeof mainNav)[number]["href"], SlideCopy> = {
  "/gallery": {
    title: "The whole portfolio",
    text: "Browse every painting, past and present: landscapes, loose florals and abstracts. Open any piece to see it up close.",
    cta: "Browse the gallery",
    accent: { text: "text-terracotta-dark", bg: "bg-terracotta" },
  },
  "/collections": {
    title: "Paintings grouped by theme",
    text: "Explore related series of work side by side, each with the story behind it.",
    cta: "See the collections",
    accent: { text: "text-teal", bg: "bg-teal" },
  },
  "/shop": {
    title: "Originals & prints",
    text: "Take home a one-of-a-kind original, or a hand-signed fine art print on archival paper or canvas. Shipped across the US and worldwide.",
    cta: "Visit the shop",
    accent: { text: "text-terracotta-dark", bg: "bg-marigold" },
  },
  "/commissions": {
    title: "A painting made just for you",
    text: "Your favorite place, your garden, your colors. From 12-inch studies to five-foot statement pieces. Share your idea and get a quote.",
    cta: "Start a commission",
    accent: { text: "text-plum", bg: "bg-plum" },
  },
  "/about": {
    title: `Meet ${site.artistName}`,
    text: "The story behind the paintings: what inspires the work, the materials, and life in the studio.",
    cta: `About ${site.artistName}`,
    accent: { text: "text-teal", bg: "bg-teal" },
  },
  "/contact": {
    title: "Let's talk",
    text: "Questions about a painting, an order, or working together? Send a note and you'll hear back within two business days.",
    cta: "Get in touch",
    accent: { text: "text-terracotta-dark", bg: "bg-terracotta" },
  },
};

export default async function HomePage() {
  const [featured, gallery, shop, collections, about] = await Promise.all([
    getFeaturedArtworks(),
    getGalleryArtworks(),
    getShopArtworks(),
    getCollections(),
    getAbout(),
  ]);
  const collectionCover = collections[0] ? await getCollectionCover(collections[0]) : undefined;

  // Give each slide its own painting: fitting ones first, then the rest in turn.
  const art: Partial<Record<string, Artwork>> = {
    "/collections": collectionCover,
    "/shop": shop.find(isOriginalForSale) ?? shop[0],
  };
  const used = new Set(Object.values(art).map((a) => a?.slug));
  const pool = [...featured, ...gallery];
  for (const { href } of mainNav) {
    if (art[href] || (href === "/about" && about.portrait)) continue;
    art[href] = pool.find((a) => !used.has(a.slug)) ?? pool[0];
    used.add(art[href]?.slug);
  }

  const slides: Slide[] = mainNav.map((item) => ({
    href: item.href,
    label: item.label,
    ...copy[item.href],
    ...(item.href === "/about" && about.portrait ? { photo: about.portrait } : { artwork: art[item.href] }),
  }));

  return <PageSlideshow slides={slides} />;
}
