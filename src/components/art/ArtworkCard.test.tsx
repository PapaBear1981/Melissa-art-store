/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleArtworks } from "@/lib/sample-data";
import { ArtworkCard } from "./ArtworkCard";

const bySlug = (slug: string) => sampleArtworks.find((a) => a.slug === slug)!;

describe("ArtworkCard", () => {
  it("links to the painting and shows its details and price", () => {
    const a = bySlug("golden-hour-hills");
    render(<ArtworkCard artwork={a} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/art/golden-hour-hills");
    expect(screen.getByRole("heading", { level: 3, name: a.title })).toBeInTheDocument();
    expect(screen.getByText(`${a.medium} · 36″ × 24″`)).toBeInTheDocument();
    expect(screen.getByText("$1,850")).toBeInTheDocument();
  });

  it("shows the status badge for sold work", () => {
    render(<ArtworkCard artwork={bySlug("marigold-rhythm")} />);
    expect(screen.getByText("Sold")).toBeInTheDocument();
    expect(screen.getByText(/^Prints from /)).toBeInTheDocument();
  });

  it("hides the price when asked", () => {
    render(<ArtworkCard artwork={bySlug("golden-hour-hills")} showPrice={false} />);
    expect(screen.queryByText("$1,850")).not.toBeInTheDocument();
  });

  it("shows no price line when nothing is for sale", () => {
    const a = bySlug("harbor-morning");
    const { container } = render(<ArtworkCard artwork={a} />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });
});
