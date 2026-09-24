import { defineField, defineType } from "sanity";

/** Created automatically when a customer pays. Melissa updates the status. */
export const order = defineType({
  name: "order",
  title: "Order",
  type: "document",
  fields: [
    defineField({
      name: "status",
      type: "string",
      options: {
        list: [
          { title: "New: needs packing", value: "new" },
          { title: "Prints at the printer", value: "printing" },
          { title: "Shipped", value: "shipped" },
          { title: "Refunded / cancelled", value: "cancelled" },
        ],
        layout: "radio",
      },
      initialValue: "new",
    }),
    defineField({ name: "problem", title: "Needs attention", type: "string", readOnly: true, description: "Set automatically, e.g. if an original sold twice." }),
    defineField({ name: "trackingNumber", title: "Tracking number", type: "string" }),
    defineField({ name: "notes", title: "Private notes", type: "text", rows: 3 }),
    defineField({ name: "placedAt", title: "Placed", type: "datetime", readOnly: true }),
    defineField({ name: "customerName", title: "Customer", type: "string", readOnly: true }),
    defineField({ name: "customerEmail", title: "Email", type: "string", readOnly: true }),
    defineField({ name: "customerPhone", title: "Phone", type: "string", readOnly: true }),
    defineField({ name: "shippingAddress", title: "Ship to", type: "text", rows: 5, readOnly: true }),
    defineField({
      name: "items",
      type: "array",
      readOnly: true,
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "name", type: "string" }),
            defineField({ name: "kind", type: "string" }),
            defineField({ name: "slug", type: "string" }),
            defineField({ name: "printOptionId", title: "Print option", type: "string" }),
            defineField({ name: "quantity", type: "number" }),
            defineField({ name: "amount", title: "Line total (USD)", type: "number" }),
          ],
          preview: { select: { title: "name", subtitle: "quantity" }, prepare: ({ title, subtitle }) => ({ title, subtitle: `Qty ${subtitle}` }) },
        },
      ],
    }),
    defineField({ name: "total", title: "Total paid (USD)", type: "number", readOnly: true }),
    defineField({ name: "stripeSessionId", title: "Stripe checkout ID", type: "string", readOnly: true }),
    defineField({ name: "testMode", title: "Test order", type: "boolean", readOnly: true }),
    defineField({ name: "fulfilledAt", title: "Processed by website", type: "datetime", readOnly: true, hidden: true }),
  ],
  orderings: [{ title: "Newest first", name: "placedDesc", by: [{ field: "placedAt", direction: "desc" }] }],
  preview: {
    select: { name: "customerName", total: "total", status: "status", placedAt: "placedAt", test: "testMode", problem: "problem" },
    prepare({ name, total, status, placedAt, test, problem }) {
      const date = placedAt ? new Date(placedAt).toLocaleDateString() : "";
      return {
        title: `${problem ? "⚠️ " : ""}${test ? "[TEST] " : ""}${name ?? "Customer"}: $${total ?? 0}`,
        subtitle: `${date} · ${status ?? "new"}`,
      };
    },
  },
});
