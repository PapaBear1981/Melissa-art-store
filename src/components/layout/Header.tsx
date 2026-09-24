"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav, site } from "@/config/site";
import { useCart } from "@/lib/cart/CartProvider";
import { container } from "@/components/ui/styles";

/** A bold, always-visible menu bar: no hamburger to hunt for. */
export function Header() {
  const pathname = usePathname();
  const { count, open } = useCart();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const links = (className: string) =>
    mainNav.map((item) => (
      <li key={item.href}>
        <Link
          href={item.href}
          className={`${className} block rounded-full text-center font-bold transition-colors ${
            isActive(item.href)
              ? "bg-marigold text-ink"
              : "bg-cream/10 text-cream hover:bg-cream hover:text-ink"
          }`}
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      </li>
    ));

  return (
    <header className="sticky top-0 z-40 bg-ink text-cream shadow-lg">
      <div className={`${container} flex h-16 items-center justify-between gap-4 lg:h-20`}>
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight hover:text-marigold lg:text-3xl">
          {site.name}
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-2">{links("px-5 py-2.5 text-base")}</ul>
        </nav>

        <button
          type="button"
          onClick={open}
          className="relative rounded-full p-2 hover:bg-cream/10"
          aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-marigold px-1 text-[11px] font-bold text-ink">
              {count}
            </span>
          )}
        </button>
      </div>

      {/* Smaller screens: every page stays one tap away, no hidden menu. */}
      <nav aria-label="Main" className="lg:hidden">
        <ul className={`${container} grid grid-cols-3 gap-2 pb-3 sm:grid-cols-6`}>
          {links("px-2 py-2 text-sm")}
        </ul>
      </nav>
    </header>
  );
}
