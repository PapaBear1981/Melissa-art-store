import "server-only";
import Stripe from "stripe";

let stripe: Stripe | null = null;

/** True once STRIPE_SECRET_KEY is set (test key during development). */
export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  stripe ??= new Stripe(key);
  return stripe;
}

export const isTestMode = () => process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? true;
