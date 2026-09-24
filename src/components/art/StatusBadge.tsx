import type { Artwork } from "@/lib/types";

export function StatusBadge({ artwork }: { artwork: Artwork }) {
  const { status } = artwork.original;
  if (status === "available") return null;
  const label = status === "sold" ? "Sold" : "Private collection";
  return (
    <span className="rounded-full bg-paper/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-plum shadow-sm">
      {label}
    </span>
  );
}
