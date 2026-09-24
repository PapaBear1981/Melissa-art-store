"use client";

import { useId, useState, useTransition } from "react";
import { useCart } from "@/lib/cart/CartProvider";
import { startCheckout } from "@/lib/checkout/actions";
import type { Destination } from "@/lib/checkout/order";
import { btn } from "@/components/ui/styles";

/** Asks where the order ships, then hands off to Stripe's secure checkout. */
export function CheckoutButton() {
  const { items } = useCart();
  const [destination, setDestination] = useState<Destination>("us");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const groupName = useId();

  const checkout = () => {
    setError(null);
    startTransition(async () => {
      const result = await startCheckout(
        items.map((i) => ({ slug: i.slug, kind: i.kind, printOptionId: i.printOptionId, quantity: i.quantity })),
        destination,
      );
      if ("url" in result) window.location.assign(result.url);
      else setError(result.error);
    });
  };

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Shipping to</legend>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {([
            ["us", "United States"],
            ["intl", "Another country"],
          ] as const).map(([value, label]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-full border px-3 py-2 text-center font-semibold has-focus-visible:ring-2 has-focus-visible:ring-teal ${
                destination === value ? "border-teal bg-teal text-white" : "border-line bg-paper hover:border-teal/50"
              }`}
            >
              <input
                type="radio"
                name={groupName}
                value={value}
                checked={destination === value}
                onChange={() => setDestination(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="button" className={`${btn("primary")} w-full`} onClick={checkout} disabled={pending || !items.length}>
        {pending ? "Opening secure checkout…" : "Secure checkout"}
      </button>
      {error && (
        <p role="alert" className="rounded-lg bg-terracotta/10 px-3 py-2 text-sm text-terracotta-dark">
          {error}
        </p>
      )}
      <p className="text-center text-xs text-muted">Payments are handled securely by Stripe.</p>
    </div>
  );
}
