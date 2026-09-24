import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { fulfillCheckout } from "@/lib/orders/fulfill";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/**
 * Stripe calls this after a checkout. Configure it in the Stripe dashboard
 * (Developers → Webhooks) for the events:
 *   checkout.session.completed, checkout.session.async_payment_succeeded
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured() || !secret) {
    return NextResponse.json({ message: "Stripe webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ message: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      try {
        await fulfillCheckout(session);
      } catch (err) {
        console.error("[stripe-webhook] fulfillment failed", err);
        // A 500 makes Stripe retry later.
        return NextResponse.json({ message: "Fulfillment failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
