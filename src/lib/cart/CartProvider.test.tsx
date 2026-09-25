/** @vitest-environment jsdom */
import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "./CartProvider";
import { cartStore, type CartItem } from "./store";

const thumb = {
  title: "Golden Hour Hills",
  widthIn: 36,
  heightIn: 24,
  placeholder: { seed: 1, palette: ["#000"], style: "abstract" as const },
};

const original: Omit<CartItem, "quantity"> = {
  key: "a:original",
  slug: "a",
  kind: "original",
  title: "A",
  detail: "Original painting",
  unitPrice: 185000,
  thumb,
};

const print: Omit<CartItem, "quantity"> = {
  key: "a:paper-12x8",
  slug: "a",
  kind: "print",
  printOptionId: "paper-12x8",
  title: "A",
  detail: "Fine art print",
  unitPrice: 4500,
  thumb,
};

const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;

describe("CartProvider", () => {
  it("renders its children", () => {
    render(<CartProvider><p>Shop</p></CartProvider>);
    expect(screen.getByText("Shop")).toBeInTheDocument();
  });

  it("totals the item count and subtotal as the cart changes", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.subtotal).toBe(0);

    act(() => {
      result.current.add(original);
      result.current.add(print, 3);
    });
    expect(result.current.count).toBe(4);
    expect(result.current.subtotal).toBe(185000 + 4500 * 3);

    act(() => result.current.setQuantity(print.key, 1));
    expect(result.current.count).toBe(2);
    expect(result.current.subtotal).toBe(189500);

    act(() => result.current.remove(original.key));
    expect(result.current.items.map((i) => i.key)).toEqual([print.key]);

    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });

  it("reflects changes made directly to the store", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => cartStore.add(print, 2));
    expect(result.current.count).toBe(2);
    act(() => cartStore.clear());
  });

  it("opens and closes the cart drawer", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });
});

describe("useCart", () => {
  it("throws a helpful error outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCart())).toThrow("useCart must be used inside <CartProvider>");
  });
});
