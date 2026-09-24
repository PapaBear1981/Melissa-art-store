"use client";

import { useMemo, useState } from "react";
import type { Artwork, Collection } from "@/lib/types";
import { Chip } from "@/components/ui/Chip";
import { ArtworkGrid } from "./ArtworkGrid";

export function GalleryBrowser({
  artworks,
  collections,
}: {
  artworks: Artwork[];
  collections: Collection[];
}) {
  const [collection, setCollection] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);

  const years = useMemo(
    () => [...new Set(artworks.map((a) => a.year))].sort((a, b) => b - a),
    [artworks],
  );

  const shown = artworks.filter(
    (a) =>
      (!collection || a.collections.includes(collection)) &&
      (!year || a.year === year),
  );

  return (
    <>
      <div className="mb-10 space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by collection">
          <Chip active={!collection} onClick={() => setCollection(null)}>All work</Chip>
          {collections.map((c) => (
            <Chip key={c.slug} active={collection === c.slug} onClick={() => setCollection(c.slug)}>
              {c.title}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by year">
          <span className="mr-1 text-sm text-muted">Year:</span>
          <Chip active={!year} onClick={() => setYear(null)}>Any</Chip>
          {years.map((y) => (
            <Chip key={y} active={year === y} onClick={() => setYear(y)}>{y}</Chip>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{shown.length} paintings shown</p>
      {shown.length ? (
        <ArtworkGrid artworks={shown} showPrice={false} />
      ) : (
        <p className="py-16 text-center text-muted">No paintings match those filters yet.</p>
      )}
    </>
  );
}
