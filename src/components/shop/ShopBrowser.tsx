"use client";

import { useState } from "react";
import type { Artwork } from "@/lib/types";
import { lowestPrintPrice } from "@/lib/prints";
import { Chip } from "@/components/ui/Chip";
import { ArtworkGrid } from "@/components/art/ArtworkGrid";

type Kind = "all" | "originals" | "prints";
type Size = "all" | "small" | "medium" | "large";
type Sort = "featured" | "newest" | "price-asc" | "price-desc";

const sizeOf = (a: Artwork): Exclude<Size, "all"> => {
  const longest = Math.max(a.widthIn, a.heightIn);
  if (longest <= 16) return "small";
  if (longest <= 30) return "medium";
  return "large";
};

/** Comparable price: the original's price when for sale, else the lowest print. */
const sortPrice = (a: Artwork, kind: Kind) => {
  const original = a.original.status === "available" ? a.original.price : undefined;
  if (kind === "prints") return lowestPrintPrice(a) ?? Infinity;
  return original ?? lowestPrintPrice(a) ?? Infinity;
};

export function ShopBrowser({ artworks }: { artworks: Artwork[] }) {
  const [kind, setKind] = useState<Kind>("all");
  const [size, setSize] = useState<Size>("all");
  const [sort, setSort] = useState<Sort>("featured");

  const shown = artworks
    .filter((a) => {
      if (kind === "originals" && a.original.status !== "available") return false;
      if (kind === "prints" && !a.printsEnabled) return false;
      if (size !== "all" && sizeOf(a) !== size) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "newest") return b.year - a.year;
      if (sort === "price-asc") return sortPrice(a, kind) - sortPrice(b, kind);
      if (sort === "price-desc") return sortPrice(b, kind) - sortPrice(a, kind);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });

  return (
    <>
      <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="What are you shopping for?">
            <Chip active={kind === "all"} onClick={() => setKind("all")}>Everything</Chip>
            <Chip active={kind === "originals"} onClick={() => setKind("originals")}>Original paintings</Chip>
            <Chip active={kind === "prints"} onClick={() => setKind("prints")}>Prints</Chip>
          </div>
          {kind !== "prints" && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Original size">
              <span className="mr-1 text-sm text-muted">Size:</span>
              <Chip active={size === "all"} onClick={() => setSize("all")}>Any</Chip>
              <Chip active={size === "small"} onClick={() => setSize("small")}>Small (up to 16″)</Chip>
              <Chip active={size === "medium"} onClick={() => setSize("medium")}>Medium (up to 30″)</Chip>
              <Chip active={size === "large"} onClick={() => setSize("large")}>Large (30″ – 5′)</Chip>
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-full border border-line bg-paper px-4 py-2 font-semibold"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>
      <p className="sr-only" aria-live="polite">{shown.length} pieces shown</p>
      {shown.length ? (
        <ArtworkGrid artworks={shown} />
      ) : (
        <p className="py-16 text-center text-muted">{artworks.length ? "Nothing matches those filters right now." : "The shop is being stocked. Check back soon!"}</p>
      )}
    </>
  );
}
