import { originalShippingTiers, quoteShippingAboveIn } from "@/config/site";
import { formatPrice } from "./format";
import { lowestPrintPrice } from "./prints";
import type { Artwork } from "./types";

/** Short price line for cards, e.g. "$1,850", "Inquire", "Prints from $45". */
export function priceSummary(a: Artwork): string | null {
  const { status, saleMode, price } = a.original;
  if (status === "available") {
    if (saleMode === "inquire-private" || price === undefined) return "Price on request";
    if (saleMode === "inquire") return `${formatPrice(price)} · Inquire`;
    return formatPrice(price);
  }
  const fromPrint = lowestPrintPrice(a);
  return fromPrint !== undefined ? `Prints from ${formatPrice(fromPrint)}` : null;
}

export type ShippingQuote =
  | { kind: "rate"; us: number; intl: number; label: string }
  | { kind: "quote" };

/** Shipping for an original painting: per-piece override, size tier, or personal quote. */
export function originalShipping(a: Artwork): ShippingQuote {
  if (a.original.shipping) {
    return { kind: "rate", ...a.original.shipping, label: "Custom" };
  }
  const longest = Math.max(a.widthIn, a.heightIn);
  if (longest > quoteShippingAboveIn) return { kind: "quote" };
  const tier = originalShippingTiers.find((t) => longest <= t.maxLongestSideIn);
  return tier ? { kind: "rate", us: tier.us, intl: tier.intl, label: tier.label } : { kind: "quote" };
}
