/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleArtworks } from "@/lib/sample-data";
import { ArtworkGrid } from "./ArtworkGrid";

describe("ArtworkGrid", () => {
  it("lists a card per painting, with prices by default", () => {
    const artworks = sampleArtworks.slice(0, 4);
    render(<ArtworkGrid artworks={artworks} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    artworks.forEach((a, i) => {
      expect(within(items[i]).getByRole("heading", { name: a.title })).toBeInTheDocument();
    });
    expect(screen.getByText("$1,850")).toBeInTheDocument();
  });

  it("can hide prices", () => {
    render(<ArtworkGrid artworks={sampleArtworks.slice(0, 1)} showPrice={false} />);
    expect(screen.queryByText("$1,850")).not.toBeInTheDocument();
  });
});
