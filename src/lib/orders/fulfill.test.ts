import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { site } from "@/config/site";
import { fulfillCheckout } from "./fulfill";

const { revalidateTag, listLineItems, loadSiteSettings, sendEmail, notificationEmail, getWriteClient } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  listLineItems: vi.fn(),
  loadSiteSettings: vi.fn(),
  sendEmail: vi.fn(),
  notificationEmail: vi.fn(),
  getWriteClient: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => ({ checkout: { sessions: { listLineItems } } }) }));
vi.mock("@/lib/content", () => ({ loadSiteSettings }));
vi.mock("@/lib/email", () => ({ sendEmail, notificationEmail }));
vi.mock("@/sanity/writeClient", () => ({ getWriteClient }));
vi.mock("@/sanity/client", () => ({ SANITY_TAG: "sanity" }));

type Doc = { _id: string; status?: string };

/** A fake Sanity write client that records every change. */
function fakeWriteClient(docsBySlug: Record<string, Doc[]> = {}) {
  const patches: { id: string; set: unknown }[] = [];
  const txPatches: { id: string; set: unknown }[] = [];
  const client = {
    patches,
    txPatches,
    create: vi.fn(async () => ({})),
    getDocument: vi.fn(async (): Promise<unknown> => null),
    fetch: vi.fn(async (_q: string, params: { slug: string }) => docsBySlug[params.slug] ?? []),
    patch: vi.fn((id: string) => ({
      set: (set: unknown) => ({
        commit: vi.fn(async () => {
          patches.push({ id, set });
        }),
      }),
    })),
    transaction: vi.fn(() => {
      const tx = {
        patch: vi.fn((id: string, fn: (p: { set: (v: unknown) => unknown }) => unknown) => {
          fn({ set: (set) => txPatches.push({ id, set }) });
          return tx;
        }),
        commit: vi.fn(async () => ({})),
      };
      return tx;
    }),
  };
  return client;
}

function lineItem(opts: {
  description?: string | null;
  name?: string;
  kind?: string;
  slug?: string;
  printOptionId?: string;
  quantity?: number | null;
  amount: number;
}) {
  return {
    description: opts.description ?? null,
    quantity: opts.quantity === undefined ? 1 : opts.quantity,
    amount_total: opts.amount,
    price: {
      product: {
        name: opts.name ?? "Product",
        metadata: { kind: opts.kind ?? "print", slug: opts.slug ?? "", printOptionId: opts.printOptionId ?? "" },
      },
    },
  };
}

const originalLine = lineItem({ description: "Sunset (original painting)", kind: "original", slug: "sunset", amount: 185000 });
const printLine = lineItem({
  description: "Meadow (fine art print, 12″ × 12″)",
  kind: "print",
  slug: "meadow",
  printOptionId: "paper-12x12",
  quantity: 2,
  amount: 9000,
});

const address = { line1: "1 Main St", line2: "Apt 2", city: "Asheville", state: "NC", postal_code: "28801", country: "US" };

function session(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: "cs_123",
    created: 1_700_000_000,
    livemode: true,
    amount_total: 201200,
    shipping_cost: { amount_total: 7200 },
    customer_details: { name: "Ann Buyer", email: "ann@b.test", phone: "+1 555 0100", address: null },
    collected_information: { shipping_details: { name: "Ann Gift", address } },
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

const artistEmail = () => sendEmail.mock.calls[0][0];
const customerEmail = () => sendEmail.mock.calls[1]?.[0];

beforeEach(() => {
  revalidateTag.mockReset();
  listLineItems.mockReset().mockResolvedValue({ data: [originalLine, printLine] });
  loadSiteSettings.mockReset().mockResolvedValue({ email: "public@art.test", location: "" });
  sendEmail.mockReset().mockResolvedValue(true);
  notificationEmail.mockReset().mockReturnValue("orders@art.test");
  getWriteClient.mockReset().mockReturnValue(null);
});

describe("fulfillCheckout: first-time fulfillment", () => {
  it("records the order, marks the original sold and marks the order processed", async () => {
    const write = fakeWriteClient({ sunset: [{ _id: "art1", status: "available" }] });
    getWriteClient.mockReturnValue(write);

    await fulfillCheckout(session());

    expect(listLineItems).toHaveBeenCalledWith("cs_123", { limit: 100, expand: ["data.price.product"] });
    expect(write.create).toHaveBeenCalledWith({
      _id: "order-cs_123",
      _type: "order",
      status: "new",
      placedAt: new Date(1_700_000_000_000).toISOString(),
      customerName: "Ann Buyer",
      customerEmail: "ann@b.test",
      customerPhone: "+1 555 0100",
      shippingAddress: "Ann Gift\n1 Main St\nApt 2\nAsheville, NC, 28801\nUS",
      items: [
        { _key: "item0", name: "Sunset (original painting)", kind: "original", slug: "sunset", printOptionId: undefined, quantity: 1, amount: 1850 },
        { _key: "item1", name: "Meadow (fine art print, 12″ × 12″)", kind: "print", slug: "meadow", printOptionId: "paper-12x12", quantity: 2, amount: 90 },
      ],
      total: 2012,
      stripeSessionId: "cs_123",
      testMode: false,
    });
    // Only originals are looked up and marked sold.
    expect(write.fetch).toHaveBeenCalledTimes(1);
    expect(write.fetch).toHaveBeenCalledWith(expect.stringContaining("slug.current == $slug"), { slug: "sunset" });
    expect(write.txPatches).toEqual([{ id: "art1", set: { status: "sold" } }]);
    expect(revalidateTag).toHaveBeenCalledWith("sanity", { expire: 0 });
    expect(write.patches).toEqual([{ id: "order-cs_123", set: { fulfilledAt: expect.any(String) } }]);
  });

  it("emails the artist a summary of the order", async () => {
    getWriteClient.mockReturnValue(fakeWriteClient());
    await fulfillCheckout(session());

    expect(artistEmail()).toEqual({
      to: "orders@art.test",
      replyTo: "ann@b.test",
      subject: "New order from Ann Buyer: $2,012",
      text: [
        "• Sunset (original painting): $1,850",
        "• Meadow (fine art print, 12″ × 12″) × 2: $90",
        "Shipping: $72",
        "Total: $2,012",
        "",
        "Ship to:",
        "Ann Gift\n1 Main St\nApt 2\nAsheville, NC, 28801\nUS",
        "",
        "Email: ann@b.test",
        "Phone: +1 555 0100",
        "",
        "Prints in this order need to be printed, signed and shipped.",
        `Order details: ${site.url}/studio`,
      ].join("\n"),
    });
  });

  it("thanks the customer by first name, mentioning both originals and prints", async () => {
    await fulfillCheckout(session());

    const email = customerEmail();
    expect(email.to).toBe("ann@b.test");
    expect(email.replyTo).toBe("public@art.test");
    expect(email.subject).toBe(`Thank you for your order from ${site.name}!`);
    expect(email.text.startsWith("Hi Ann,\n")).toBe(true);
    expect(email.text).toContain("• Meadow (fine art print, 12″ × 12″) × 2: $90\nShipping: $72\nTotal: $2,012");
    expect(email.text).toContain("Original paintings are carefully packed");
    expect(email.text).toContain("Prints are printed for you, hand-signed");
    expect(email.text).toContain(`With gratitude,\n${site.artistName}`);
  });

  it("keeps blank lines between the paragraphs of the customer's email", async () => {
    await fulfillCheckout(session());
    const text = customerEmail().text;
    expect(text.startsWith("Hi Ann,\n\nThank you so much for your order!")).toBe(true);
    expect(text).toContain("Total: $2,012\n\nShipping to:\nAnn Gift\n1 Main St");
    expect(text).toContain("\n\nQuestions? Just reply to this email.\n\nWith gratitude,");
  });

  it("sends the artist email to the public address when NOTIFICATION_EMAIL isn't set", async () => {
    notificationEmail.mockReturnValue("");
    await fulfillCheckout(session());
    expect(artistEmail().to).toBe("public@art.test");
  });
});

describe("fulfillCheckout: without a write token", () => {
  it("warns, skips saving, and still sends both emails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await fulfillCheckout(session());
    expect(warn).toHaveBeenCalledWith(
      "[orders] SANITY_API_WRITE_TOKEN not set: order not saved and originals not marked sold",
    );
    expect(revalidateTag).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });
});

describe("fulfillCheckout: repeated webhooks", () => {
  const conflict = Object.assign(new Error("Document already exists"), { statusCode: 409 });

  it("does nothing when the order was already fulfilled", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const write = fakeWriteClient({ sunset: [{ _id: "art1", status: "sold" }] });
    write.create.mockRejectedValue(conflict);
    write.getDocument.mockResolvedValue({ fulfilledAt: "2026-01-01T00:00:00Z" });
    getWriteClient.mockReturnValue(write);

    await fulfillCheckout(session());

    expect(write.getDocument).toHaveBeenCalledWith("order-cs_123");
    expect(info).toHaveBeenCalledWith("[orders] cs_123 already processed");
    expect(write.fetch).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(write.patches).toEqual([]);
  });

  it("finishes a half-done order without flagging its own earlier sale as a double sale", async () => {
    const write = fakeWriteClient({ sunset: [{ _id: "art1", status: "sold" }] });
    write.create.mockRejectedValue(conflict);
    write.getDocument.mockResolvedValue({ _id: "order-cs_123" });
    getWriteClient.mockReturnValue(write);

    await fulfillCheckout(session());

    expect(write.txPatches).toEqual([{ id: "art1", set: { status: "sold" } }]);
    expect(write.patches).toEqual([{ id: "order-cs_123", set: { fulfilledAt: expect.any(String) } }]);
    expect(artistEmail().subject).toBe("New order from Ann Buyer: $2,012");
    expect(artistEmail().text).not.toContain("⚠️");
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("finishes the job when the existing order document can't be read back", async () => {
    const write = fakeWriteClient();
    write.create.mockRejectedValue(conflict);
    getWriteClient.mockReturnValue(write);
    await fulfillCheckout(session());
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("rethrows any other error so Stripe retries later", async () => {
    const write = fakeWriteClient();
    const boom = Object.assign(new Error("server error"), { statusCode: 500 });
    write.create.mockRejectedValue(boom);
    getWriteClient.mockReturnValue(write);

    await expect(fulfillCheckout(session())).rejects.toBe(boom);
    expect(write.getDocument).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("fulfillCheckout: double sales", () => {
  it("flags an original that was already sold and warns the artist", async () => {
    const write = fakeWriteClient({
      sunset: [
        { _id: "drafts.art1", status: "available" },
        { _id: "art1", status: "sold" },
      ],
    });
    getWriteClient.mockReturnValue(write);

    await fulfillCheckout(session());

    const problem = "Already sold before this payment: Sunset (original painting). Refund the customer in Stripe.";
    expect(write.patches[0]).toEqual({ id: "order-cs_123", set: { problem } });
    expect(artistEmail().subject).toBe("⚠️ New order from Ann Buyer: $2,012");
    expect(artistEmail().text.startsWith(`⚠️ ${problem}\n\n• Sunset`)).toBe(true);
  });

  it("marks the unpublished draft sold too, so publishing it can't undo the sale", async () => {
    const write = fakeWriteClient({
      sunset: [
        { _id: "art1", status: "available" },
        { _id: "drafts.art1", status: "available" },
      ],
    });
    getWriteClient.mockReturnValue(write);

    await fulfillCheckout(session());

    expect(write.txPatches).toEqual([
      { id: "art1", set: { status: "sold" } },
      { id: "drafts.art1", set: { status: "sold" } },
    ]);
    expect(artistEmail().subject).not.toContain("⚠️");
  });

  it("doesn't treat a sold draft as a double sale", async () => {
    const write = fakeWriteClient({ sunset: [{ _id: "drafts.art1", status: "sold" }] });
    getWriteClient.mockReturnValue(write);
    await fulfillCheckout(session());
    expect(write.txPatches).toEqual([{ id: "drafts.art1", set: { status: "sold" } }]);
    expect(artistEmail().subject).not.toContain("⚠️");
  });

  it("skips originals without a slug", async () => {
    listLineItems.mockResolvedValue({ data: [lineItem({ description: "Mystery", kind: "original", amount: 100 })] });
    const write = fakeWriteClient();
    getWriteClient.mockReturnValue(write);
    await fulfillCheckout(session());
    expect(write.fetch).not.toHaveBeenCalled();
    expect(write.transaction).not.toHaveBeenCalled();
  });
});

describe("fulfillCheckout: test mode", () => {
  it("prefixes both subjects with [TEST] and records a test order", async () => {
    const write = fakeWriteClient();
    getWriteClient.mockReturnValue(write);

    await fulfillCheckout(session({ livemode: false }));

    expect(write.create).toHaveBeenCalledWith(expect.objectContaining({ testMode: true }));
    expect(artistEmail().subject).toBe("[TEST] New order from Ann Buyer: $2,012");
    expect(customerEmail().subject).toBe(`[TEST] Thank you for your order from ${site.name}!`);
  });
});

describe("fulfillCheckout: missing session details", () => {
  it("falls back to the billing address and name when there is no shipping info", async () => {
    const write = fakeWriteClient();
    getWriteClient.mockReturnValue(write);
    await fulfillCheckout(
      session({
        collected_information: null,
        customer_details: {
          name: "Bo",
          email: "bo@b.test",
          phone: null,
          address: { line1: "9 Rue X", line2: null, city: "Paris", state: null, postal_code: "75001", country: "FR" },
        } as Stripe.Checkout.Session.CustomerDetails,
      }),
    );
    expect(write.create).toHaveBeenCalledWith(
      expect.objectContaining({ shippingAddress: "Bo\n9 Rue X\nParis, 75001\nFR", customerName: "Bo", customerPhone: "" }),
    );
    expect(artistEmail().text).toContain("Phone: \n");
  });

  it("handles a session with no customer, address, totals or creation time", async () => {
    vi.useFakeTimers({ now: new Date("2026-02-03T04:05:06.000Z"), toFake: ["Date"] });
    const write = fakeWriteClient();
    getWriteClient.mockReturnValue(write);

    await fulfillCheckout(
      session({
        customer_details: null,
        collected_information: { shipping_details: { name: "Cy", address: null } } as unknown as Stripe.Checkout.Session.CollectedInformation,
        amount_total: null,
        shipping_cost: null,
        created: undefined as unknown as number,
      }),
    );
    vi.useRealTimers();

    expect(write.create).toHaveBeenCalledWith(
      expect.objectContaining({
        placedAt: "2026-02-03T04:05:06.000Z",
        customerName: "Cy",
        customerEmail: "",
        customerPhone: "",
        shippingAddress: "",
        total: 0,
      }),
    );
    expect(artistEmail().subject).toBe("New order from a customer: $0");
    expect(artistEmail().replyTo).toBeUndefined();
    expect(artistEmail().text).toContain("Shipping: $0\nTotal: $0");
    expect(artistEmail().text).toContain("Email: \n");
    // No customer email address, so only the artist is emailed.
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("uses an empty name when neither the customer nor shipping has one", async () => {
    const write = fakeWriteClient();
    getWriteClient.mockReturnValue(write);
    await fulfillCheckout(
      session({
        customer_details: { email: "x@y.test", name: null } as Stripe.Checkout.Session.CustomerDetails,
        collected_information: null,
      }),
    );
    expect(write.create).toHaveBeenCalledWith(expect.objectContaining({ customerName: "", shippingAddress: "" }));
    expect(customerEmail().text.startsWith("Hi there,\n")).toBe(true);
    // No address on file: leave out the "Shipping to:" heading.
    expect(customerEmail().text).not.toContain("Shipping to:");
  });

  it("greets an unnamed customer as \"there\" and the artist sees \"a customer\"", async () => {
    await fulfillCheckout(session({ customer_details: { email: "x@y.test" } as Stripe.Checkout.Session.CustomerDetails }));
    expect(customerEmail().text.startsWith("Hi there,\n")).toBe(true);
    expect(artistEmail().subject).toBe("New order from a customer: $2,012");
  });

  it("defaults missing product details to a single print called 'Item'", async () => {
    listLineItems.mockResolvedValue({
      data: [
        { description: null, quantity: null, amount_total: 4500, price: null },
        { description: null, quantity: 1, amount_total: 500, price: { product: { name: "Named product", metadata: {} } } },
      ],
    });
    const write = fakeWriteClient();
    getWriteClient.mockReturnValue(write);

    await fulfillCheckout(session());

    expect(write.create).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          { _key: "item0", name: "Item", kind: "print", slug: "", printOptionId: undefined, quantity: 1, amount: 45 },
          { _key: "item1", name: "Named product", kind: "print", slug: "", printOptionId: undefined, quantity: 1, amount: 5 },
        ],
      }),
    );
  });
});

describe("fulfillCheckout: email wording by order contents", () => {
  it("mentions only originals for an originals-only order", async () => {
    listLineItems.mockResolvedValue({ data: [originalLine] });
    await fulfillCheckout(session());

    expect(artistEmail().text).not.toContain("Prints in this order");
    expect(customerEmail().text).toContain("Original paintings are carefully packed");
    expect(customerEmail().text).not.toContain("Prints are printed for you");
  });

  it("mentions only prints for a prints-only order", async () => {
    listLineItems.mockResolvedValue({ data: [printLine] });
    await fulfillCheckout(session());

    expect(artistEmail().text).toContain("Prints in this order need to be printed, signed and shipped.");
    expect(customerEmail().text).not.toContain("Original paintings");
    expect(customerEmail().text).toContain("Prints are printed for you, hand-signed, and usually ship within 1–2 weeks.");
  });
});
