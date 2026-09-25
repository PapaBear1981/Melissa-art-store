/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleArtworks } from "@/lib/sample-data";
import type { Artwork } from "@/lib/types";
import { ArtworkImage } from "./ArtworkImage";

const art = sampleArtworks[0];
const withImage = (lqip?: string): Artwork => ({
  ...art,
  image: { src: "/scan.jpg", width: 1200, height: 800, alt: "Hills at sunset", lqip },
});

describe("ArtworkImage", () => {
  it("shows the placeholder painting at its real proportions when there is no scan", () => {
    const { container } = render(<ArtworkImage artwork={art} className="rounded" />);
    expect(screen.getByRole("img", { name: `${art.title} (placeholder image)` })).toBeInTheDocument();
    const frame = container.firstElementChild as HTMLElement;
    expect(frame.style.aspectRatio).toBe(`${art.widthIn} / ${art.heightIn}`);
    expect(frame).toHaveClass("w-full", "rounded");
    expect(frame).not.toHaveClass("h-full");
  });

  it("shows the scan with its alt text", () => {
    render(<ArtworkImage artwork={withImage()} />);
    expect(screen.getByRole("img", { name: "Hills at sunset" })).toBeInTheDocument();
  });

  it("uses the blurred preview while a scan with one loads", () => {
    render(<ArtworkImage artwork={withImage("data:image/png;base64,AAAA")} priority />);
    const img = screen.getByRole("img", { name: "Hills at sunset" });
    expect(img.style.backgroundImage).toContain("data:image/png;base64,AAAA");
  });

  it("fills its container when asked", () => {
    const { container } = render(<ArtworkImage artwork={art} fit="fill" />);
    const frame = container.firstElementChild as HTMLElement;
    expect(frame).toHaveClass("h-full", "w-full");
    expect(frame.style.aspectRatio).toBe("");
  });
});
