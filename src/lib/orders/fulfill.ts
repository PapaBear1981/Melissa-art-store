import "server-only";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { site } from "@/config/site";
import { loadSiteSettings } from "@/lib/content";
import { sendEmail, notificationEmail } from "@/lib/email";
import { formatPrice } from "@/lib/format";
import { getStripe } from "@/lib/stripe";
import { SANITY_TAG } from "@/sanity/client";
import { getWriteClient } from "@/sanity/writeClient";

interface PaidItem {
  name: string;
  kind: "original" | "print";
  slug: string;
  printOptionId?: string;
  quantity: number;
  amount: number;
}

function formatAddress(a: Stripe.Address | null | undefined, name?: string | null) {
  if (!a) return "";
  return [name, a.line1, a.line2, [a.city, a.state, a.postal_code].filter(Boolean).join(", "), a.country]
    .filter(Boolean)
    .join("\n");
}

async function paidItems(sessionId: string): Promise<PaidItem[]> {
  const lineItems = await getStripe().checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ["data.price.product"],
  });
  return lineItems.data.map((li) => {
    const product = li.price?.product as Stripe.Product | undefined;
    const meta = product?.metadata ?? {};
    return {
      name: li.description ?? product?.name ?? "Item",
      kind: meta.kind === "original" ? "original" : "print",
      slug: meta.slug ?? "",
      printOptionId: meta.printOptionId || undefined,
      quantity: li.quantity ?? 1,
      amount: li.amount_total,
    };
  });
}

/**
 * Marks originals as sold on the dashboard. Also updates any unpublished
 * draft so publishing it later can't flip the painting back to available.
 * Returns titles of originals that were already sold (double sale).
 */
async function markOriginalsSold(items: PaidItem[]): Promise<string[]> {
  const write = getWriteClient();
  const originals = items.filter((i) => i.kind === "original" && i.slug);
  if (!write || !originals.length) return [];

  const alreadySold: string[] = [];
  for (const item of originals) {
    const docs = await write.fetch<{ _id: string; status?: string }[]>(
      `*[_type == "artwork" && slug.current == $slug]{ _id, status }`,
      { slug: item.slug },
    );
    const published = docs.find((d) => !d._id.startsWith("drafts."));
    if (published?.status === "sold") alreadySold.push(item.name);
    const tx = write.transaction();
    docs.forEach((d) => tx.patch(d._id, (p) => p.set({ status: "sold" })));
    await tx.commit();
  }
  return alreadySold;
}

/**
 * Called by the Stripe webhook once a payment succeeds. Safe to call more
 * than once for the same checkout: the order record acts as a lock.
 */
export async function fulfillCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const items = await paidItems(session.id);
  const customer = session.customer_details;
  const shipping = session.collected_information?.shipping_details;
  const address = formatAddress(shipping?.address ?? customer?.address, shipping?.name ?? customer?.name);
  const total = session.amount_total ?? 0;
  const test = !session.livemode;

  // Record the order first. The order ID doubles as a lock, so a repeated
  // webhook for the same checkout doesn't send duplicate emails.
  const write = getWriteClient();
  const orderId = `order-${session.id}`;
  let isRetry = false;
  if (write) {
    try {
      await write.create({
        _id: orderId,
        _type: "order",
        status: "new",
        placedAt: new Date((session.created ?? Date.now() / 1000) * 1000).toISOString(),
        customerName: customer?.name ?? shipping?.name ?? "",
        customerEmail: customer?.email ?? "",
        customerPhone: customer?.phone ?? "",
        shippingAddress: address,
        items: items.map((i, n) => ({ _key: `item${n}`, ...i, amount: i.amount / 100 })),
        total: total / 100,
        stripeSessionId: session.id,
        testMode: test,
      });
    } catch (err) {
      if ((err as { statusCode?: number }).statusCode !== 409) throw err;
      const existing = await write.getDocument<{ fulfilledAt?: string }>(orderId);
      if (existing?.fulfilledAt) {
        console.info(`[orders] ${session.id} already processed`);
        return;
      }
      // An earlier attempt failed partway through; finish the job.
      isRetry = true;
    }
  } else {
    console.warn("[orders] SANITY_API_WRITE_TOKEN not set: order not saved and originals not marked sold");
  }

  const alreadySold = await markOriginalsSold(items);
  const problem = alreadySold.length && !isRetry
    ? `Already sold before this payment: ${alreadySold.join(", ")}. Refund the customer in Stripe.`
    : undefined;
  if (write && problem) await write.patch(orderId).set({ problem }).commit();
  revalidateTag(SANITY_TAG, { expire: 0 });

  const itemLines = items
    .map((i) => `• ${i.name}${i.quantity > 1 ? ` × ${i.quantity}` : ""}: ${formatPrice(i.amount)}`)
    .join("\n");
  const shippingLine = `Shipping: ${formatPrice(session.shipping_cost?.amount_total ?? 0)}`;
  const prefix = test ? "[TEST] " : "";

  const settings = await loadSiteSettings();
  const artistTo = notificationEmail() || settings.email;
  await sendEmail({
    to: artistTo,
    replyTo: customer?.email ?? undefined,
    subject: `${prefix}${problem ? "⚠️ " : ""}New order from ${customer?.name ?? "a customer"}: ${formatPrice(total)}`,
    text: [
      problem && `⚠️ ${problem}\n`,
      itemLines,
      shippingLine,
      `Total: ${formatPrice(total)}`,
      "",
      "Ship to:",
      address,
      "",
      `Email: ${customer?.email ?? ""}`,
      `Phone: ${customer?.phone ?? ""}`,
      "",
      items.some((i) => i.kind === "print")
        ? "Prints in this order need to be printed, signed and shipped."
        : "",
      `Order details: ${site.url}/studio`,
    ]
      .filter((l): l is string => l !== undefined)
      .join("\n"),
  });

  if (customer?.email) {
    await sendEmail({
      to: customer.email,
      replyTo: settings.email,
      subject: `${prefix}Thank you for your order from ${site.name}!`,
      text: [
        `Hi ${customer.name?.split(" ")[0] ?? "there"},`,
        "",
        `Thank you so much for your order! Here's what you bought:`,
        "",
        itemLines,
        shippingLine,
        `Total: ${formatPrice(total)}`,
        "",
        ...(address ? ["Shipping to:", address, ""] : []),
        items.some((i) => i.kind === "original")
          ? "Original paintings are carefully packed and shipped from the studio within about 5 business days."
          : undefined,
        items.some((i) => i.kind === "print")
          ? "Prints are printed for you, hand-signed, and usually ship within 1–2 weeks."
          : undefined,
        "You'll get another email with tracking once your order ships.",
        "",
        `Questions? Just reply to this email.`,
        "",
        `With gratitude,\n${site.artistName}`,
      ]
        // Keep the "" entries: they're the blank lines between paragraphs.
        .filter((l): l is string => l !== undefined)
        .join("\n"),
    });
  }

  if (write) await write.patch(orderId).set({ fulfilledAt: new Date().toISOString() }).commit();
}
