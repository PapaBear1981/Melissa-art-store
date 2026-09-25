/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/lib/cart/CartProvider";
import { cartStore } from "@/lib/cart/store";
import { originalShipping } from "@/lib/pricing";
import { getPrintOptions, type PrintOption } from "@/lib/prints";
import { sampleArtworks } from "@/lib/sample-data";
import type { Artwork } from "@/lib/types";
import { PurchasePanel } from "./PurchasePanel";

vi.mock("@/lib/forms/actions", () => ({ submitInquiry: vi.fn() }));

const bySlug = (slug: string) => sampleArtworks.find((a) => a.slug === slug)!;

function CartState() {
  const { isOpen } = useCart();
  return <p data-testid="cart-state">{isOpen ? "cart open" : "cart closed"}</p>;
}

function renderPanel(artwork: Artwork, printOptions: PrintOption[] = getPrintOptions(artwork)) {
  render(
    <CartProvider>
      <PurchasePanel artwork={artwork} printOptions={printOptions} shipping={originalShipping(artwork)} />
      <CartState />
    </CartProvider>,
  );
}

const tab = (name: string) => screen.getByRole("tab", { name });
const radio = (name: RegExp) => screen.getByRole("radio", { name });
const cartState = () => screen.getByTestId("cart-state");

describe("PurchasePanel: original painting", () => {
  it("opens on the original when it is available, with tabs for prints", () => {
    renderPanel(bySlug("golden-hour-hills"));
    expect(screen.getByRole("tablist", { name: "Purchase options" })).toBeInTheDocument();
    expect(tab("Original painting")).toHaveAttribute("aria-selected", "true");
    expect(tab("Prints")).toHaveAttribute("aria-selected", "false");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", "tab-original");
    expect(within(panel).getByText("One-of-a-kind original · 36″ × 24″ (91 × 61 cm)")).toBeInTheDocument();
    expect(within(panel).getByText("$1,850")).toBeInTheDocument();
    expect(within(panel).getByText(/US \$150 · International \$400\./)).toBeInTheDocument();
  });

  it("adds the original to the cart once and opens the cart", async () => {
    const art = bySlug("golden-hour-hills");
    renderPanel(art);
    expect(cartState()).toHaveTextContent("cart closed");

    await userEvent.click(screen.getByRole("button", { name: "Add original to cart" }));

    expect(cartStore.getSnapshot()).toEqual([
      expect.objectContaining({
        key: "golden-hour-hills:original",
        kind: "original",
        title: art.title,
        detail: "Original painting · 36″ × 24″",
        unitPrice: 185000,
        quantity: 1,
      }),
    ]);
    expect(cartState()).toHaveTextContent("cart open");
    expect(screen.getByRole("button", { name: "In your cart" })).toBeDisabled();
  });

  it("shows 'In your cart' when the original is already in the cart", () => {
    const art = bySlug("golden-hour-hills");
    cartStore.add({
      key: "golden-hour-hills:original",
      slug: art.slug,
      kind: "original",
      title: art.title,
      detail: "",
      unitPrice: 185000,
      thumb: art,
    });
    renderPanel(art);
    expect(screen.getByRole("button", { name: "In your cart" })).toBeDisabled();
  });

  it("toggles a question form for buy-now pieces", async () => {
    renderPanel(bySlug("golden-hour-hills"));
    const toggle = screen.getByRole("button", { name: "Have a question about this piece?" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Send inquiry" })).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Send inquiry" })).toBeInTheDocument();

    await userEvent.click(toggle);
    expect(screen.queryByRole("button", { name: "Send inquiry" })).not.toBeInTheDocument();
  });

  it("asks buyers to inquire for inquire-only pieces, with quoted shipping for huge ones", async () => {
    renderPanel(bySlug("tidewater"));
    expect(screen.getByText("$6,500")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add original/ })).not.toBeInTheDocument();
    expect(screen.getByText(/shipping \(crating or art freight\) is quoted personally/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Inquire about this piece" }));
    expect(screen.queryByRole("button", { name: "Inquire about this piece" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^Questions or notes/ })).toHaveAttribute(
      "placeholder",
      "I'm interested in “Tidewater”…",
    );
  });

  it("hides the price for private-price pieces", () => {
    renderPanel(bySlug("coral-and-teal"));
    expect(screen.getByText("Price on request")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inquire about this piece" })).toBeInTheDocument();
  });

  it("falls back to an inquiry when a buy-now piece has no price", () => {
    const art = bySlug("golden-hour-hills");
    renderPanel({ ...art, original: { status: "available", saleMode: "buy-now" } });
    expect(screen.getByText("Price on request")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add original/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inquire about this piece" })).toBeInTheDocument();
  });
});

describe("PurchasePanel: original not for sale", () => {
  it("opens on prints for a sold piece, and the original tab points back to prints", async () => {
    renderPanel(bySlug("marigold-rhythm"));
    expect(tab("Prints")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "tab-prints");

    await userEvent.click(tab("Original painting"));
    expect(screen.getByText("The original has found its home.")).toBeInTheDocument();
    expect(screen.getByText("You can still bring it home as a fine art print or canvas.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Commission a painting" })).toHaveAttribute("href", "/commissions");

    await userEvent.click(screen.getByRole("button", { name: "See print options" }));
    expect(tab("Prints")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("group", { name: "Material" })).toBeInTheDocument();
  });

  it("explains when the original is in the private collection", async () => {
    renderPanel(bySlug("desert-bloom"));
    await userEvent.click(tab("Original painting"));
    expect(screen.getByText("The original is in Melissa's private collection.")).toBeInTheDocument();
  });

  it("suggests a commission when there are no prints either", () => {
    renderPanel(bySlug("harbor-morning"));
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).not.toHaveAttribute("aria-labelledby");
    expect(screen.getByText("The original has found its home.")).toBeInTheDocument();
    expect(screen.getByText("Love this style? Commission something made just for you.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "See print options" })).not.toBeInTheDocument();
  });
});

describe("PurchasePanel: prints", () => {
  const art = bySlug("golden-hour-hills");
  const options = getPrintOptions(art);

  it("defaults to the smallest paper print and adds the chosen quantity", async () => {
    renderPanel(art);
    await userEvent.click(tab("Prints"));
    expect(radio(/^Fine art print/)).toBeChecked();
    expect(radio(/^12″ × 8″/)).toBeChecked();
    expect(screen.getAllByRole("radio", { name: /″ × / })).toHaveLength(4);
    expect(screen.getByText(/shipped from the studio in about 1–2 weeks/)).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Quantity" }), "3");
    const add = screen.getByRole("button", { name: "Add to cart · $135" });
    await userEvent.click(add);

    expect(cartStore.getSnapshot()).toEqual([
      expect.objectContaining({
        key: "golden-hour-hills:paper-12x8",
        kind: "print",
        printOptionId: "paper-12x8",
        detail: "Fine art print · 12″ × 8″",
        unitPrice: 4500,
        quantity: 3,
      }),
    ]);
    expect(cartState()).toHaveTextContent("cart open");
  });

  it("changes size, and keeps that size when switching material", async () => {
    renderPanel(art);
    await userEvent.click(tab("Prints"));
    await userEvent.click(radio(/^30″ × 20″/));
    expect(radio(/^30″ × 20″/)).toBeChecked();
    expect(screen.getByRole("button", { name: "Add to cart · $125" })).toBeInTheDocument();

    await userEvent.click(radio(/^Stretched canvas/));
    expect(radio(/^Stretched canvas/)).toBeChecked();
    expect(radio(/^30″ × 20″/)).toBeChecked();
    expect(screen.getByRole("button", { name: "Add to cart · $225" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Add to cart · $225" }));
    expect(cartStore.getSnapshot()[0]).toMatchObject({
      printOptionId: "canvas-30x20",
      detail: "Stretched canvas · 30″ × 20″",
      quantity: 1,
    });
  });

  it("falls back to the first size when the other material lacks it", async () => {
    const noLargeCanvas = options.filter((o) => o.id !== "canvas-36x24");
    renderPanel(art, noLargeCanvas);
    await userEvent.click(tab("Prints"));
    await userEvent.click(radio(/^36″ × 24″/));
    await userEvent.click(radio(/^Stretched canvas/));
    expect(screen.getAllByRole("radio", { name: /″ × / })).toHaveLength(3);
    expect(radio(/^12″ × 8″/)).toBeChecked();
  });

  it("offers nothing to add for a material with no sizes", async () => {
    const canvasOnly = options.filter((o) => o.material === "canvas");
    renderPanel(art, canvasOnly);
    await userEvent.click(tab("Prints"));
    expect(radio(/^Fine art print/)).toBeChecked();
    expect(screen.queryAllByRole("radio", { name: /″ × / })).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /Add to cart/ })).not.toBeInTheDocument();

    await userEvent.click(radio(/^Stretched canvas/));
    expect(radio(/^12″ × 8″/)).toBeChecked();
    expect(screen.getByRole("button", { name: "Add to cart · $85" })).toBeInTheDocument();

    await userEvent.click(radio(/^Fine art print/));
    expect(screen.queryByRole("button", { name: /Add to cart/ })).not.toBeInTheDocument();
  });
});
