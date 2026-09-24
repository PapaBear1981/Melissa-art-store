import Link from "next/link";
import type { Artwork } from "@/lib/types";
import { formatDimensions } from "@/lib/format";
import { priceSummary } from "@/lib/pricing";
import { ArtworkImage } from "./ArtworkImage";
import { StatusBadge } from "./StatusBadge";

export function ArtworkCard({
  artwork,
  showPrice = true,
  priority,
}: {
  artwork: Artwork;
  showPrice?: boolean;
  priority?: boolean;
}) {
  const price = showPrice ? priceSummary(artwork) : null;
  return (
    <Link href={`/art/${artwork.slug}`} className="group block">
      <div className="relative">
        <ArtworkImage
          artwork={artwork}
          priority={priority}
          className="rounded-sm shadow-[0_10px_30px_-12px_rgba(43,30,26,0.35)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-12px_rgba(43,30,26,0.45)]"
        />
        <div className="absolute top-3 left-3">
          <StatusBadge artwork={artwork} />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="font-display text-xl leading-snug group-hover:text-terracotta-dark">
          {artwork.title}
        </h3>
        <p className="mt-0.5 text-sm text-muted">
          {artwork.medium} · {formatDimensions(artwork.widthIn, artwork.heightIn)}
        </p>
        {price && <p className="mt-1 text-sm font-semibold">{price}</p>}
      </div>
    </Link>
  );
}
