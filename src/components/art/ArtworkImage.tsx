import Image from "next/image";
import type { Artwork } from "@/lib/types";
import { ArtPlaceholder } from "./ArtPlaceholder";

type Props = {
  artwork: Pick<Artwork, "title" | "widthIn" | "heightIn" | "image" | "placeholder">;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Keep the painting's real proportions (default) or fill the container. */
  fit?: "natural" | "fill";
};

export function ArtworkImage({
  artwork,
  className = "",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority,
  fit = "natural",
}: Props) {
  const style =
    fit === "natural"
      ? { aspectRatio: `${artwork.widthIn} / ${artwork.heightIn}` }
      : undefined;

  return (
    <div
      className={`relative overflow-hidden bg-blush ${fit === "fill" ? "h-full w-full" : "w-full"} ${className}`}
      style={style}
    >
      {artwork.image ? (
        <Image
          src={artwork.image.src}
          alt={artwork.image.alt}
          fill
          sizes={sizes}
          priority={priority}
          placeholder={artwork.image.lqip ? "blur" : "empty"}
          blurDataURL={artwork.image.lqip}
          className="object-cover"
        />
      ) : (
        <ArtPlaceholder
          art={artwork.placeholder}
          widthIn={artwork.widthIn}
          heightIn={artwork.heightIn}
          title={artwork.title}
          className="absolute inset-0 h-full w-full"
        />
      )}
    </div>
  );
}
