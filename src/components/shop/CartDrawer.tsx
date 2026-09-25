"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart/CartProvider";
import { formatPrice } from "@/lib/format";
import { btn } from "@/components/ui/styles";
import { CartLines } from "./CartLines";
import { CheckoutButton } from "./CheckoutButton";

export function CartDrawer() {
  const { items, subtotal, isOpen, close } = useCart();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // The <dialog> is always rendered, so the ref is set by the time effects run.
    const dialog = dialogRef.current!;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
      aria-label="Shopping cart"
      className="fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-full max-w-md bg-cream p-0 text-ink shadow-2xl backdrop:bg-ink/40"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-2xl">Your cart</h2>
          <button type="button" onClick={close} className="rounded-full p-2 hover:bg-blush" aria-label="Close cart">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-muted">Your cart is empty.</p>
            <Link href="/shop" onClick={close} className={btn("secondary")}>
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              <CartLines onNavigate={close} />
            </div>
            <div className="space-y-4 border-t border-line px-6 py-5">
              <div className="flex justify-between text-lg">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted">Shipping and taxes are calculated at checkout.</p>
              <CheckoutButton />
              <Link href="/cart" onClick={close} className="block text-center text-sm font-semibold underline underline-offset-4">
                View full cart
              </Link>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
