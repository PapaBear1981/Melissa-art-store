import type { Artwork } from "@/lib/types";
import { ArtworkCard } from "./ArtworkCard";

/** Masonry-style grid that keeps every painting's real proportions. */
export function ArtworkGrid({
  artworks,
  showPrice = true,
}: {
  artworks: Artwork[];
  showPrice?: boolean;
}) {
  return (
    <ul className="columns-1 gap-8 sm:columns-2 lg:columns-3">
      {artworks.map((a, i) => (
        <li key={a.slug} className="mb-12 break-inside-avoid">
          <ArtworkCard artwork={a} showPrice={showPrice} priority={i < 3} />
        </li>
      ))}
    </ul>
  );
}
