"use server";

import { headers } from "next/headers";
import type Stripe from "stripe";
import { internationalShippingCountries, site } from "@/config/site";
import { loadArtworksFresh } from "@/lib/content";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { buildOrder, type CheckoutRequestItem, type Destination } from "./order";

export type CheckoutResult = { url: string } | { error: string };

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : site.url;
}

export async function startCheckout(
  items: CheckoutRequestItem[],
  destination: Destination,
): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return { error: "Online checkout isn't switched on yet. Please contact us to buy." };
  }
  if (!Array.isArray(items) || items.length > 50 || (destination !== "us" && destination !== "intl")) {
    return { error: "Something went wrong with your cart. Please refresh and try again." };
  }

  const slugs = [...new Set(items.map((i) => String(i.slug)))];
  const artworks = new Map((await loadArtworksFresh(slugs)).map((a) => [a.slug, a]));
  const order = buildOrder(items, artworks, destination);
  if (!order.ok) return { error: order.error };

  const origin = await siteOrigin();
  const hasOriginal = order.lines.some((l) => l.kind === "original");

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: order.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: "usd",
        unit_amount: line.unitAmount,
        product_data: {
          name: line.name,
          description: line.description,
          images: line.imageUrl ? [line.imageUrl] : undefined,
          metadata: {
            slug: line.slug,
            kind: line.kind,
            printOptionId: line.printOptionId ?? "",
          },
        },
      },
    })),
    shipping_address_collection: {
      allowed_countries: (destination === "us"
        ? ["US"]
        : [...internationalShippingCountries]) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: destination === "us" ? "Standard shipping (tracked)" : "International shipping (tracked)",
          fixed_amount: { amount: order.shipping, currency: "usd" },
        },
      },
    ],
    phone_number_collection: { enabled: true },
    automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
    metadata: { destination, hasOriginal: String(hasOriginal) },
    // Originals are one of a kind, so don't hold a checkout open for long.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
  };

  try {
    const session = await getStripe().checkout.sessions.create(params);
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return { url: session.url };
  } catch (err) {
    console.error("[checkout] failed to create session", err);
    return { error: "We couldn't start checkout just now. Please try again in a moment." };
  }
}
