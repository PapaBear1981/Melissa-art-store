/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CartProvider } from "@/lib/cart/CartProvider";
import { cartStore, toThumb } from "@/lib/cart/store";
import { getPrintOptions } from "@/lib/prints";
import { sampleArtworks } from "@/lib/sample-data";
import { CartPageContents } from "./CartPageContents";

vi.mock("@/lib/checkout/actions", () => ({ startCheckout: vi.fn() }));

const printed = sampleArtworks.find((a) => a.slug === "plum-season")!;
const print = getPrintOptions(printed).find((o) => o.material === "canvas")!;

describe("CartPageContents", () => {
  it("points shoppers to the shop when the cart is empty", () => {
    render(<CartProvider><CartPageContents /></CartProvider>);
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse the shop" })).toHaveAttribute("href", "/shop");
    expect(screen.queryByRole("button", { name: "Secure checkout" })).not.toBeInTheDocument();
  });

  it("lists the items with an order summary and checkout", () => {
    cartStore.add(
      {
        key: `${printed.slug}:${print.id}`,
        slug: printed.slug,
        kind: "print",
        printOptionId: print.id,
        title: printed.title,
        detail: "Stretched canvas",
        unitPrice: print.price,
        thumb: toThumb(printed),
      },
      2,
    );
    render(<CartProvider><CartPageContents /></CartProvider>);
    expect(screen.getByRole("link", { name: printed.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Order summary" })).toBeInTheDocument();
    const subtotal = screen.getByText("Subtotal").nextElementSibling;
    expect(subtotal).toHaveTextContent(`$${((print.price * 2) / 100).toLocaleString("en-US")}`);
    expect(screen.getByRole("button", { name: "Secure checkout" })).toBeEnabled();
  });
});
