/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/lib/cart/CartProvider";
import { cartStore, toThumb } from "@/lib/cart/store";
import { sampleArtworks } from "@/lib/sample-data";
import { CartDrawer } from "./CartDrawer";

vi.mock("@/lib/checkout/actions", () => ({ startCheckout: vi.fn() }));

const art = sampleArtworks.find((a) => a.slug === "peonies-in-june")!;

function OpenCart() {
  const { open } = useCart();
  return <button type="button" onClick={open}>Open cart</button>;
}

function renderDrawer() {
  render(
    <CartProvider>
      <OpenCart />
      <CartDrawer />
    </CartProvider>,
  );
}

const openDrawer = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Open cart" }));
  return screen.getByRole<HTMLDialogElement>("dialog", { name: "Shopping cart" });
};

const seed = () =>
  cartStore.add({
    key: `${art.slug}:original`,
    slug: art.slug,
    kind: "original",
    title: art.title,
    detail: "Original painting",
    unitPrice: art.original.price!,
    thumb: toThumb(art),
  });

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  });
  const stop = (e: Event) => e.preventDefault();
  document.addEventListener("click", stop);
  return () => document.removeEventListener("click", stop);
});

describe("CartDrawer", () => {
  it("stays closed until the cart is opened", async () => {
    renderDrawer();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const dialog = await openDrawer();
    expect(dialog).toHaveAttribute("open");
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  });

  it("shows an empty cart with a link to the shop that closes the drawer", async () => {
    renderDrawer();
    const dialog = await openDrawer();
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Browse the shop" }));
    expect(dialog).not.toHaveAttribute("open");
  });

  it("lists items with the subtotal and checkout", async () => {
    seed();
    renderDrawer();
    await openDrawer();
    expect(screen.getByRole("link", { name: art.title })).toBeInTheDocument();
    expect(screen.getByText("Subtotal").nextElementSibling).toHaveTextContent("$950");
    expect(screen.getByRole("button", { name: "Secure checkout" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "View full cart" })).toHaveAttribute("href", "/cart");
  });

  it.each([
    ["the close button", () => userEvent.click(screen.getByRole("button", { name: "Close cart" }))],
    ["View full cart", () => userEvent.click(screen.getByRole("link", { name: "View full cart" }))],
    ["an item link", () => userEvent.click(screen.getByRole("link", { name: art.title }))],
    ["the backdrop", () => userEvent.click(screen.getByRole("dialog"))],
  ])("closes from %s", async (_, closeIt) => {
    seed();
    renderDrawer();
    const dialog = await openDrawer();
    await closeIt();
    expect(dialog).not.toHaveAttribute("open");
  });

  it("stays open when clicking inside the drawer", async () => {
    seed();
    renderDrawer();
    const dialog = await openDrawer();
    await userEvent.click(screen.getByRole("heading", { name: "Your cart" }));
    expect(dialog).toHaveAttribute("open");
  });

  it("syncs its state when the browser closes it (Escape)", async () => {
    renderDrawer();
    const dialog = await openDrawer();
    // The browser closes the dialog itself, then fires "close".
    dialog.open = false;
    fireEvent(dialog, new Event("close"));
    // Opening again works because the cart knows it was closed.
    await openDrawer();
    expect(dialog).toHaveAttribute("open");
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(2);
  });
});
