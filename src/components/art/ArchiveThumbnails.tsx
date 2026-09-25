import Link from "next/link";
import type { Artwork } from "@/lib/types";
import { ArtworkImage } from "./ArtworkImage";

/** A compact grid of square thumbnails, each linking to the painting's page. */
export function ArchiveThumbnails({ artworks }: { artworks: Artwork[] }) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
      {artworks.map((a) => (
        <li key={a.slug}>
          <Link href={`/art/${a.slug}`} className="group block" title={a.title}>
            <div className="aspect-square overflow-hidden rounded-lg">
              <div className="h-full w-full transition duration-500 group-hover:scale-105">
                <ArtworkImage artwork={a} fit="fill" sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw" />
              </div>
            </div>
            <p className="mt-2 truncate text-sm group-hover:text-terracotta-dark">{a.title}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
