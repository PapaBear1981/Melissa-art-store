"use client";

import { useRef } from "react";
import type { Artwork } from "@/lib/types";
import { ArtworkImage } from "./ArtworkImage";

/** Main artwork image; click to view it full screen. */
export function Lightbox({ artwork }: { artwork: Artwork }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const landscape = artwork.widthIn >= artwork.heightIn;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="group relative mx-auto block w-full cursor-zoom-in"
        // Keep tall paintings within the screen height.
        style={{ maxWidth: `calc(80vh * ${artwork.widthIn / artwork.heightIn})` }}
        aria-label={`View ${artwork.title} full screen`}
      >
        <ArtworkImage
          artwork={artwork}
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="rounded-sm shadow-[0_24px_60px_-20px_rgba(43,30,26,0.5)]"
        />
        <span className="absolute right-3 bottom-3 rounded-full bg-paper/90 px-3 py-1 text-xs font-semibold opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Click to enlarge
        </span>
      </button>

      <dialog
        ref={dialogRef}
        onClick={() => dialogRef.current?.close()}
        aria-label={`${artwork.title}, full screen`}
        className="m-0 h-full max-h-none w-full max-w-none bg-ink/95 p-4 backdrop:bg-ink/80 sm:p-10"
      >
        <div className="flex h-full w-full items-center justify-center">
          <div
            className={landscape ? "w-full max-w-[min(100%,calc((100vh-5rem)*var(--r)))]" : "h-full max-h-full"}
            style={{ "--r": artwork.widthIn / artwork.heightIn, aspectRatio: `${artwork.widthIn} / ${artwork.heightIn}` } as React.CSSProperties}
          >
            <ArtworkImage artwork={artwork} fit="fill" sizes="100vw" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="absolute top-4 right-4 rounded-full bg-paper/90 px-4 py-2 text-sm font-semibold text-ink"
        >
          Close
        </button>
      </dialog>
    </>
  );
}
