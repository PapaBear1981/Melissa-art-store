"use client";

import Link from "next/link";
import { btn } from "@/components/ui/styles";

/**
 * Checkout goes through Stripe Checkout. Wired up in the payments phase;
 * until then the button is shown but disabled.
 */
export function CheckoutButton() {
  return (
    <div>
      <button type="button" className={`${btn("primary")} w-full`} disabled>
        Secure checkout
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Online checkout is coming soon. For now, please{" "}
        <Link href="/contact" className="underline">contact us</Link> to purchase.
      </p>
    </div>
  );
}
