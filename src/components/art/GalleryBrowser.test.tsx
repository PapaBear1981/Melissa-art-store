/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sampleArtworks, sampleCollections } from "@/lib/sample-data";
import { GalleryBrowser } from "./GalleryBrowser";

const shownTitles = () =>
  screen.queryAllByRole("heading", { level: 3 }).map((h) => h.textContent);

const titlesWhere = (keep: (a: (typeof sampleArtworks)[number]) => boolean) =>
  sampleArtworks.filter(keep).map((a) => a.title);

function renderGallery() {
  render(<GalleryBrowser artworks={sampleArtworks} collections={sampleCollections} />);
}

describe("GalleryBrowser", () => {
  it("shows all work without prices by default", () => {
    renderGallery();
    expect(shownTitles()).toEqual(sampleArtworks.map((a) => a.title));
    expect(screen.getByText(`${sampleArtworks.length} paintings shown`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All work" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("$1,850")).not.toBeInTheDocument();
  });

  it("lists years newest first", () => {
    renderGallery();
    const yearChips = screen
      .getByRole("group", { name: "Filter by year" })
      .querySelectorAll("button");
    expect([...yearChips].map((b) => b.textContent)).toEqual(["Any", "2025", "2024", "2023"]);
  });

  it("filters by collection and back to all work", async () => {
    renderGallery();
    const garden = sampleCollections.find((c) => c.slug === "garden-party")!;
    await userEvent.click(screen.getByRole("button", { name: garden.title }));
    expect(screen.getByRole("button", { name: garden.title })).toHaveAttribute("aria-pressed", "true");
    expect(shownTitles()).toEqual(titlesWhere((a) => a.collections.includes("garden-party")));

    await userEvent.click(screen.getByRole("button", { name: "All work" }));
    expect(shownTitles()).toHaveLength(sampleArtworks.length);
  });

  it("filters by year and back to any year", async () => {
    renderGallery();
    await userEvent.click(screen.getByRole("button", { name: "2023" }));
    expect(screen.getByRole("button", { name: "2023" })).toHaveAttribute("aria-pressed", "true");
    expect(shownTitles()).toEqual(titlesWhere((a) => a.year === 2023));

    await userEvent.click(screen.getByRole("button", { name: "Any" }));
    expect(shownTitles()).toHaveLength(sampleArtworks.length);
  });

  it("combines filters and says when nothing matches", async () => {
    renderGallery();
    const big = sampleCollections.find((c) => c.slug === "big-and-bold")!;
    await userEvent.click(screen.getByRole("button", { name: big.title }));
    await userEvent.click(screen.getByRole("button", { name: "2024" }));
    expect(shownTitles()).toEqual([]);
    expect(screen.getByText("No paintings match those filters.")).toBeInTheDocument();
    expect(screen.getByText("0 paintings shown")).toBeInTheDocument();
  });

  it("says new work is coming when there is none yet", () => {
    render(<GalleryBrowser artworks={[]} collections={[]} />);
    expect(screen.getByText("New paintings are on their way. Check back soon!")).toBeInTheDocument();
  });
});
