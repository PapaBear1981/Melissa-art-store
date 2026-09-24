import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { ClearCart } from "@/components/shop/ClearCart";
import { btn, container } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Thank you!", robots: { index: false } };

async function loadSession(id: string | undefined) {
  if (!id || !isStripeConfigured() || !id.startsWith("cs_")) return null;
  try {
    const stripe = getStripe();
    const [session, lineItems] = await Promise.all([
      stripe.checkout.sessions.retrieve(id),
      stripe.checkout.sessions.listLineItems(id, { limit: 100 }),
    ]);
    if (session.payment_status === "unpaid") return null;
    return { session, lineItems: lineItems.data };
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const { session_id } = await searchParams;
  const data = await loadSession(typeof session_id === "string" ? session_id : undefined);

  if (!data) {
    return (
      <div className={`${container} py-24 text-center`}>
        <h1 className="font-display text-4xl">We couldn&apos;t find that order</h1>
        <p className="mt-4 text-muted">If you just paid, check your email for a confirmation, or contact us and we&apos;ll sort it out.</p>
        <Link href="/contact" className={`${btn("outline")} mt-8`}>Contact us</Link>
      </div>
    );
  }

  const { session, lineItems } = data;
  const firstName = session.customer_details?.name?.split(" ")[0];

  return (
    <div className={`${container} max-w-2xl py-16`}>
      <ClearCart />
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-terracotta-dark">Order confirmed</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Thank you{firstName ? `, ${firstName}` : ""}!</h1>
      <p className="mt-4 text-lg text-muted">
        Your order is in. A confirmation has been sent to <strong className="text-ink">{session.customer_details?.email}</strong>, and you&apos;ll get tracking details once it ships.
      </p>

      <div className="mt-10 rounded-2xl border border-line bg-paper p-6">
        <h2 className="font-display text-2xl">Order summary</h2>
        <ul className="mt-4 divide-y divide-line">
          {lineItems.map((li) => (
            <li key={li.id} className="flex justify-between gap-4 py-3">
              <span>
                {li.description}
                {li.quantity && li.quantity > 1 ? ` × ${li.quantity}` : ""}
              </span>
              <span className="font-semibold">{formatPrice(li.amount_total)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 space-y-1 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><span>Shipping</span><span>{formatPrice(session.shipping_cost?.amount_total ?? 0)}</span></div>
          {(session.total_details?.amount_tax ?? 0) > 0 && (
            <div className="flex justify-between"><span>Tax</span><span>{formatPrice(session.total_details!.amount_tax)}</span></div>
          )}
          <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>{formatPrice(session.amount_total ?? 0)}</span></div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/gallery" className={btn("primary")}>Keep browsing</Link>
        <Link href="/contact" className={btn("outline")}>Questions? Contact us</Link>
      </div>
    </div>
  );
}
