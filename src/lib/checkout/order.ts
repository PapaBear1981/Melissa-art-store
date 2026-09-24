import { formatDimensions } from "@/lib/format";
import { getPrintOption, printMaterials, printShipping } from "@/lib/prints";
import { originalShipping } from "@/lib/pricing";
import type { Artwork } from "@/lib/types";

/**
 * Turns what's in a customer's cart into a priced order. Runs on the
 * server with fresh data, so prices in the browser are never trusted.
 */

export type Destination = "us" | "intl";

export interface CheckoutRequestItem {
  slug: string;
  kind: "original" | "print";
  printOptionId?: string;
  quantity: number;
}

export interface OrderLine {
  slug: string;
  kind: "original" | "print";
  printOptionId?: string;
  name: string;
  description: string;
  unitAmount: number;
  quantity: number;
  imageUrl?: string;
}

export type OrderResult =
  | { ok: true; lines: OrderLine[]; shipping: number; subtotal: number }
  | { ok: false; error: string };

const MAX_PRINT_QUANTITY = 10;

export function buildOrder(
  items: CheckoutRequestItem[],
  artworks: Map<string, Artwork>,
  destination: Destination,
): OrderResult {
  if (!items.length) return { ok: false, error: "Your cart is empty." };

  const lines: OrderLine[] = [];
  let originalShippingTotal = 0;
  const printCounts = { paper: 0, canvas: 0 };

  for (const item of items) {
    const art = artworks.get(item.slug);
    if (!art) {
      return { ok: false, error: "One of the pieces in your cart is no longer available. Please remove it and try again." };
    }
    const imageUrl = art.image ? `${art.image.src}?w=600&auto=format` : undefined;

    if (item.kind === "original") {
      const { status, saleMode, price } = art.original;
      if (status !== "available" || saleMode !== "buy-now" || !price) {
        return { ok: false, error: `Sorry, the original “${art.title}” is no longer available to buy online. Please remove it from your cart.` };
      }
      const ship = originalShipping(art);
      if (ship.kind === "quote") {
        return { ok: false, error: `“${art.title}” needs a personal shipping quote. Please contact us to buy this piece.` };
      }
      originalShippingTotal += destination === "us" ? ship.us : ship.intl;
      lines.push({
        slug: art.slug,
        kind: "original",
        name: `${art.title} (original painting)`,
        description: `${art.medium}, ${formatDimensions(art.widthIn, art.heightIn)}. One of a kind.`,
        unitAmount: price,
        quantity: 1,
        imageUrl,
      });
      continue;
    }

    const option = item.printOptionId ? getPrintOption(art, item.printOptionId) : undefined;
    if (!option) {
      return { ok: false, error: `The print size you chose for “${art.title}” is no longer offered. Please remove it and choose again.` };
    }
    const quantity = Math.min(Math.max(Math.floor(item.quantity) || 1, 1), MAX_PRINT_QUANTITY);
    printCounts[option.material] += quantity;
    lines.push({
      slug: art.slug,
      kind: "print",
      printOptionId: option.id,
      name: `${art.title} (${printMaterials[option.material].label.toLowerCase()}, ${formatDimensions(option.widthIn, option.heightIn)})`,
      description: `${formatDimensions(option.widthIn, option.heightIn)}, hand-signed.`,
      unitAmount: option.price,
      quantity,
      imageUrl,
    });
  }

  // Prints: full rate for the first print of each material, reduced after that.
  let printShippingTotal = 0;
  for (const material of ["paper", "canvas"] as const) {
    const count = printCounts[material];
    if (!count) continue;
    const rate = printShipping[material];
    const [first, extra] = destination === "us" ? [rate.us, rate.usExtra] : [rate.intl, rate.intlExtra];
    printShippingTotal += first + extra * (count - 1);
  }

  return {
    ok: true,
    lines,
    shipping: originalShippingTotal + printShippingTotal,
    subtotal: lines.reduce((sum, l) => sum + l.unitAmount * l.quantity, 0),
  };
}
