/** @vitest-environment jsdom */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartProvider } from "@/lib/cart/CartProvider";
import { cartStore, toThumb } from "@/lib/cart/store";
import { sampleArtworks } from "@/lib/sample-data";
import { ClearCart } from "./ClearCart";

describe("ClearCart", () => {
  it("empties the cart once rendered and shows nothing", () => {
    const a = sampleArtworks[0];
    cartStore.add({
      key: `${a.slug}:original`,
      slug: a.slug,
      kind: "original",
      title: a.title,
      detail: "Original painting",
      unitPrice: a.original.price!,
      thumb: toThumb(a),
    });
    expect(cartStore.getSnapshot()).toHaveLength(1);

    const { container } = render(<CartProvider><ClearCart /></CartProvider>);
    expect(container).toBeEmptyDOMElement();
    expect(cartStore.getSnapshot()).toEqual([]);
  });
});
