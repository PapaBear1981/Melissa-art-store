/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleArtworks } from "@/lib/sample-data";
import type { PlaceholderArt } from "@/lib/types";
import { ArtPlaceholder } from "./ArtPlaceholder";

const withStyle = (style: PlaceholderArt["style"]) =>
  sampleArtworks.find((a) => a.placeholder.style === style)!;

describe("ArtPlaceholder", () => {
  it.each(["landscape", "abstract", "floral"] as const)(
    "draws a labelled %s scene matching the painting's proportions",
    (style) => {
      const a = withStyle(style);
      render(<ArtPlaceholder art={a.placeholder} widthIn={a.widthIn} heightIn={a.heightIn} title={a.title} className="cover" />);
      const img = screen.getByRole("img", { name: `${a.title} (placeholder image)` });
      const scale = 1000 / Math.max(a.widthIn, a.heightIn);
      expect(img).toHaveAttribute(
        "viewBox",
        `0 0 ${Math.round(a.widthIn * scale)} ${Math.round(a.heightIn * scale)}`,
      );
      expect(img).toHaveClass("cover");
      expect(img.querySelectorAll("path, ellipse, circle").length).toBeGreaterThan(0);
    },
  );

  it("draws the same picture for the same seed", () => {
    const a = withStyle("abstract");
    const first = render(<ArtPlaceholder art={a.placeholder} widthIn={10} heightIn={20} title="A" />);
    const html = first.container.innerHTML;
    first.unmount();
    const second = render(<ArtPlaceholder art={a.placeholder} widthIn={10} heightIn={20} title="A" />);
    expect(second.container.innerHTML).toBe(html);
  });

  it("falls back to the first color for flower centers on a short palette", () => {
    const palette = ["#111111", "#222222", "#333333", "#444444"];
    const { container } = render(
      <ArtPlaceholder art={{ seed: 5, palette, style: "floral" }} widthIn={10} heightIn={10} title="Short" />,
    );
    const centers = container.querySelectorAll("g[transform] > circle");
    expect(centers).toHaveLength(6);
    centers.forEach((c) => expect(c).toHaveAttribute("fill", "#111111"));
  });
});
