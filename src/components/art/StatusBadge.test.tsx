/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleArtworks } from "@/lib/sample-data";
import { StatusBadge } from "./StatusBadge";

const bySlug = (slug: string) => sampleArtworks.find((a) => a.slug === slug)!;

describe("StatusBadge", () => {
  it("shows nothing while the original is available", () => {
    const { container } = render(<StatusBadge artwork={bySlug("golden-hour-hills")} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("marks sold originals", () => {
    render(<StatusBadge artwork={bySlug("marigold-rhythm")} />);
    expect(screen.getByText("Sold")).toBeInTheDocument();
  });

  it("marks originals kept in the private collection", () => {
    render(<StatusBadge artwork={bySlug("desert-bloom")} />);
    expect(screen.getByText("Private collection")).toBeInTheDocument();
  });
});
