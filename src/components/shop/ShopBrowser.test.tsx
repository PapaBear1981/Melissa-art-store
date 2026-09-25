/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sampleArtworks } from "@/lib/sample-data";
import { ShopBrowser } from "./ShopBrowser";

const shown = () =>
  screen.queryAllByRole("heading", { level: 3 }).map((h) => h.textContent);
const title = (slug: string) => sampleArtworks.find((a) => a.slug === slug)!.title;
const titles = (...slugs: string[]) => slugs.map(title);

const renderShop = () => render(<ShopBrowser artworks={sampleArtworks} />);
const sortBy = (label: string) =>
  userEvent.selectOptions(screen.getByRole("combobox", { name: "Sort by" }), label);
const chip = (name: string) => screen.getByRole("button", { name });

describe("ShopBrowser", () => {
  it("shows everything with featured work first", () => {
    renderShop();
    expect(chip("Everything")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Any")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveValue("featured");
    expect(shown()).toEqual(
      titles(
        "golden-hour-hills", "peonies-in-june", "marigold-rhythm", "tidewater",
        "citrus-grove", "plum-season", "wildflower-field", "coral-and-teal",
        "ranunculus", "desert-bloom", "harbor-morning", "sunburst",
      ),
    );
    expect(screen.getByText("12 pieces shown")).toBeInTheDocument();
    // Prices are shown in the shop.
    expect(screen.getByText("$1,850")).toBeInTheDocument();
  });

  it("shows only originals that are for sale", async () => {
    renderShop();
    await userEvent.click(chip("Original paintings"));
    expect(chip("Original paintings")).toHaveAttribute("aria-pressed", "true");
    expect(shown()).toEqual(
      titles(
        "golden-hour-hills", "peonies-in-june", "tidewater", "citrus-grove",
        "plum-season", "coral-and-teal", "ranunculus", "sunburst",
      ),
    );
  });

  it("shows only work available as prints and hides the size filter", async () => {
    renderShop();
    await userEvent.click(chip("Prints"));
    expect(shown()).not.toContain(title("harbor-morning"));
    expect(shown()).toHaveLength(11);
    expect(screen.queryByRole("group", { name: "Original size" })).not.toBeInTheDocument();

    await userEvent.click(chip("Everything"));
    expect(shown()).toHaveLength(12);
    expect(screen.getByRole("group", { name: "Original size" })).toBeInTheDocument();
  });

  it("ignores a chosen size while browsing prints, and restores it after", async () => {
    renderShop();
    await userEvent.click(chip("Small (up to 16″)"));
    expect(shown()).toHaveLength(2);
    await userEvent.click(chip("Prints"));
    expect(shown()).toHaveLength(11);
    await userEvent.click(chip("Everything"));
    expect(shown()).toHaveLength(2);
  });

  it.each([
    ["Small (up to 16″)", ["citrus-grove", "ranunculus"]],
    ["Medium (up to 30″)", ["peonies-in-june", "marigold-rhythm", "plum-season", "desert-bloom", "harbor-morning"]],
    ["Large (30″ – 5′)", ["golden-hour-hills", "tidewater", "wildflower-field", "coral-and-teal", "sunburst"]],
  ])("filters by size: %s", async (label, slugs) => {
    renderShop();
    await userEvent.click(chip(label));
    expect(chip(label)).toHaveAttribute("aria-pressed", "true");
    // Listed featured-first, as the default sort puts them.
    expect(shown()).toEqual(titles(...slugs));

    await userEvent.click(chip("Any"));
    expect(shown()).toHaveLength(12);
  });

  it("sorts newest first", async () => {
    renderShop();
    await sortBy("Newest");
    expect(shown()).toEqual(
      titles(
        "golden-hour-hills", "peonies-in-june", "tidewater", "coral-and-teal", "ranunculus", "sunburst",
        "marigold-rhythm", "citrus-grove", "plum-season", "harbor-morning",
        "wildflower-field", "desert-bloom",
      ),
    );
  });

  it("sorts by price, using the lowest print price when the original isn't for sale", async () => {
    renderShop();
    await sortBy("Price: low to high");
    const lowToHigh = titles(
      // Prints from $45 (sold, private or price-on-request originals)
      "marigold-rhythm", "wildflower-field", "coral-and-teal", "desert-bloom",
      "citrus-grove", "ranunculus", "peonies-in-june", "plum-season",
      "golden-hour-hills", "sunburst", "tidewater",
      // Nothing to buy at all goes last.
      "harbor-morning",
    );
    expect(shown()).toEqual(lowToHigh);

    await sortBy("Price: high to low");
    expect(shown()).toEqual(
      titles(
        "harbor-morning", "tidewater", "sunburst", "golden-hour-hills", "plum-season",
        "peonies-in-june", "ranunculus", "citrus-grove",
        "marigold-rhythm", "wildflower-field", "coral-and-teal", "desert-bloom",
      ),
    );
  });

  it("sorts prints by print price, ignoring the original's price", async () => {
    renderShop();
    await userEvent.click(chip("Prints"));
    const featuredOrder = shown();
    await sortBy("Price: low to high");
    // Every piece's smallest print costs the same, so the order is unchanged
    // (whereas by original price Citrus Grove would jump ahead of Golden Hour Hills).
    expect(shown()).toEqual(featuredOrder);
    await sortBy("Price: high to low");
    expect(shown()).toEqual(featuredOrder);
  });

  it("says when nothing matches the filters", async () => {
    render(<ShopBrowser artworks={sampleArtworks.filter((a) => a.original.status === "sold")} />);
    await userEvent.click(chip("Original paintings"));
    expect(shown()).toEqual([]);
    expect(screen.getByText("Nothing matches those filters right now.")).toBeInTheDocument();
    expect(screen.getByText("0 pieces shown")).toBeInTheDocument();
  });

  it("says the shop is being stocked when it is empty", () => {
    render(<ShopBrowser artworks={[]} />);
    expect(screen.getByText("The shop is being stocked. Check back soon!")).toBeInTheDocument();
  });
});
