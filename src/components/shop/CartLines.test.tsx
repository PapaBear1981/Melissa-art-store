/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "@/lib/cart/CartProvider";
import { cartStore, toThumb } from "@/lib/cart/store";
import { getPrintOptions } from "@/lib/prints";
import { sampleArtworks } from "@/lib/sample-data";
import { CartLines } from "./CartLines";

const original = sampleArtworks.find((a) => a.slug === "golden-hour-hills")!;
const printed = sampleArtworks.find((a) => a.slug === "marigold-rhythm")!;
const print = getPrintOptions(printed)[0];

function seed() {
  cartStore.add({
    key: `${original.slug}:original`,
    slug: original.slug,
    kind: "original",
    title: original.title,
    detail: "Original painting · 36″ × 24″",
    unitPrice: original.original.price!,
    thumb: toThumb(original),
  });
  cartStore.add(
    {
      key: `${printed.slug}:${print.id}`,
      slug: printed.slug,
      kind: "print",
      printOptionId: print.id,
      title: printed.title,
      detail: "Fine art print · 8″ × 8″",
      unitPrice: print.price,
      thumb: toThumb(printed),
    },
    2,
  );
}

const lines = () => screen.queryAllByRole("listitem");

// jsdom can't follow links; stop the browser default so only app code runs.
beforeEach(() => {
  const stop = (e: Event) => e.preventDefault();
  document.addEventListener("click", stop);
  return () => document.removeEventListener("click", stop);
});

describe("CartLines", () => {
  it("lists each item with its details and line total", () => {
    seed();
    render(<CartProvider><CartLines /></CartProvider>);
    const [first, second] = lines();

    expect(within(first).getByRole("link", { name: original.title })).toHaveAttribute("href", `/art/${original.slug}`);
    expect(within(first).getByText("Original painting · 36″ × 24″")).toBeInTheDocument();
    expect(within(first).getByText("$1,850")).toBeInTheDocument();
    expect(within(first).getByText("One of a kind")).toBeInTheDocument();
    expect(within(first).queryByRole("button", { name: /quantity/ })).not.toBeInTheDocument();
    expect(within(first).getByRole("img", { name: `${original.title} (placeholder image)` })).toBeInTheDocument();

    expect(within(second).getByText("Fine art print · 8″ × 8″")).toBeInTheDocument();
    expect(within(second).getByText("2")).toBeInTheDocument();
    expect(within(second).getByText("$90")).toBeInTheDocument();
  });

  it("changes print quantities and drops a print at zero", async () => {
    seed();
    render(<CartProvider><CartLines /></CartProvider>);
    const second = lines()[1];

    await userEvent.click(within(second).getByRole("button", { name: `Increase quantity of ${printed.title}` }));
    expect(within(second).getByText("3")).toBeInTheDocument();
    expect(within(second).getByText("$135")).toBeInTheDocument();

    const decrease = within(second).getByRole("button", { name: `Decrease quantity of ${printed.title}` });
    await userEvent.click(decrease);
    await userEvent.click(decrease);
    expect(within(second).getByText("$45")).toBeInTheDocument();
    await userEvent.click(decrease);
    expect(lines()).toHaveLength(1);
    expect(cartStore.getSnapshot().map((i) => i.slug)).toEqual([original.slug]);
  });

  it("removes an item", async () => {
    seed();
    render(<CartProvider><CartLines /></CartProvider>);
    await userEvent.click(within(lines()[0]).getByRole("button", { name: "Remove" }));
    expect(lines()).toHaveLength(1);
    expect(screen.queryByText(original.title)).not.toBeInTheDocument();
  });

  it("tells the caller when a link is followed", async () => {
    seed();
    const onNavigate = vi.fn();
    render(<CartProvider><CartLines onNavigate={onNavigate} /></CartProvider>);
    const first = lines()[0];
    await userEvent.click(within(first).getByRole("link", { name: original.title }));
    await userEvent.click(within(first).getAllByRole("link")[0]);
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });

  it("renders an empty list for an empty cart", () => {
    render(<CartProvider><CartLines /></CartProvider>);
    expect(screen.getByRole("list")).toBeEmptyDOMElement();
  });
});
