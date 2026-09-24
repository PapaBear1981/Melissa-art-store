"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartProvider";
import { formatPrice } from "@/lib/format";
import { ArtworkImage } from "@/components/art/ArtworkImage";

export function CartLines({ onNavigate }: { onNavigate?: () => void }) {
  const { items, setQuantity, remove } = useCart();

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.key} className="flex gap-4 py-5">
          <Link href={`/art/${item.slug}`} onClick={onNavigate} className="w-20 shrink-0 sm:w-24">
            <ArtworkImage artwork={item.thumb} sizes="96px" className="rounded shadow-sm" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/art/${item.slug}`} onClick={onNavigate} className="font-display text-lg leading-tight hover:text-terracotta-dark">
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-muted">{item.detail}</p>
              </div>
              <p className="shrink-0 font-semibold">{formatPrice(item.unitPrice * item.quantity)}</p>
            </div>
            <div className="mt-auto flex items-center justify-between pt-3">
              {item.kind === "print" ? (
                <div className="flex items-center rounded-full border border-line">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full hover:bg-blush"
                    onClick={() => setQuantity(item.key, item.quantity - 1)}
                    aria-label={`Decrease quantity of ${item.title}`}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm" aria-live="polite">{item.quantity}</span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full hover:bg-blush"
                    onClick={() => setQuantity(item.key, item.quantity + 1)}
                    aria-label={`Increase quantity of ${item.title}`}
                  >
                    +
                  </button>
                </div>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-wider text-teal">One of a kind</span>
              )}
              <button
                type="button"
                onClick={() => remove(item.key)}
                className="text-sm text-muted underline-offset-4 hover:text-terracotta-dark hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
