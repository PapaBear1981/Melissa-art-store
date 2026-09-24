"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartProvider";
import { formatPrice } from "@/lib/format";
import { btn } from "@/components/ui/styles";
import { CartLines } from "./CartLines";
import { CheckoutButton } from "./CheckoutButton";

export function CartPageContents() {
  const { items, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-paper py-20 text-center">
        <p className="text-lg text-muted">Your cart is empty.</p>
        <Link href="/shop" className={`${btn("secondary")} mt-6`}>Browse the shop</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <CartLines />
      </div>
      <aside className="h-fit space-y-4 rounded-2xl border border-line bg-paper p-6">
        <h2 className="font-display text-2xl">Order summary</h2>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted">
          <span>Shipping &amp; taxes</span>
          <span>At checkout</span>
        </div>
        <CheckoutButton />
        <ul className="space-y-1 border-t border-line pt-4 text-xs text-muted">
          <li>Secure payment by Stripe: cards, Apple Pay and Google Pay.</li>
          <li>We ship to the US and internationally. Import duties are paid by the buyer.</li>
        </ul>
      </aside>
    </div>
  );
}
