import { site } from "@/config/site";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: site.currency,
  maximumFractionDigits: 0,
});

/** Format a price given in cents. */
export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

function formatLength(inches: number): string {
  if (inches >= 48 && inches % 12 === 0) return `${inches / 12}′`;
  return `${inches}″`;
}

/** e.g. `24″ × 36″` or `5′ × 5′` */
export function formatDimensions(widthIn: number, heightIn: number): string {
  return `${formatLength(widthIn)} × ${formatLength(heightIn)}`;
}

/** e.g. `61 × 91 cm` for international buyers. */
export function formatDimensionsCm(widthIn: number, heightIn: number): string {
  return `${Math.round(widthIn * 2.54)} × ${Math.round(heightIn * 2.54)} cm`;
}
