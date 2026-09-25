/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { mainNav, site } from "@/config/site";
import { CartProvider, useCart } from "@/lib/cart/CartProvider";
import { cartStore, toThumb } from "@/lib/cart/store";
import { getPrintOptions } from "@/lib/prints";
import { sampleArtworks } from "@/lib/sample-data";
import { Header } from "./Header";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

function CartState() {
  const { isOpen } = useCart();
  return <p>{isOpen ? "cart open" : "cart closed"}</p>;
}

function renderAt(path: string) {
  vi.mocked(usePathname).mockReturnValue(path);
  render(
    <CartProvider>
      <Header />
      <CartState />
    </CartProvider>,
  );
}

function addPrints(quantity: number) {
  const art = sampleArtworks[0];
  const option = getPrintOptions(art)[0];
  cartStore.add(
    {
      key: `${art.slug}:${option.id}`,
      slug: art.slug,
      kind: "print",
      printOptionId: option.id,
      title: art.title,
      detail: "",
      unitPrice: option.price,
      thumb: toThumb(art),
    },
    quantity,
  );
}

describe("Header", () => {
  it("links home and to every page, in both menus", () => {
    renderAt("/");
    expect(screen.getByRole("link", { name: site.name })).toHaveAttribute("href", "/");
    const navs = screen.getAllByRole("navigation", { name: "Main" });
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      expect(within(nav).getAllByRole("link").map((l) => l.getAttribute("href"))).toEqual(
        mainNav.map((n) => n.href),
      );
      expect(within(nav).queryByRole("link", { current: "page" })).not.toBeInTheDocument();
    }
  });

  it.each(["/shop", "/shop/prints"])("marks Shop as the current page at %s", (path) => {
    renderAt(path);
    for (const nav of screen.getAllByRole("navigation", { name: "Main" })) {
      const current = within(nav).getByRole("link", { current: "page" });
      expect(current).toHaveTextContent("Shop");
      expect(current).toHaveClass("bg-marigold");
    }
  });

  it("does not treat a page that merely starts with the same letters as current", () => {
    renderAt("/shopping");
    expect(screen.queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });

  it("shows an empty cart and opens it", async () => {
    renderAt("/");
    const cart = screen.getByRole("button", { name: "Open cart, 0 items" });
    expect(cart).not.toHaveTextContent(/\d/);
    await userEvent.click(cart);
    expect(screen.getByText("cart open")).toBeInTheDocument();
  });

  it("counts a single item", () => {
    addPrints(1);
    renderAt("/");
    expect(screen.getByRole("button", { name: "Open cart, 1 item" })).toHaveTextContent("1");
  });

  it("counts several items", () => {
    addPrints(3);
    renderAt("/");
    expect(screen.getByRole("button", { name: "Open cart, 3 items" })).toHaveTextContent("3");
  });
});
