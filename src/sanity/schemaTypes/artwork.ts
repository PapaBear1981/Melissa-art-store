import { defineField, defineType } from "sanity";

const LARGE_INCHES = 48;

export const artwork = defineType({
  name: "artwork",
  title: "Painting",
  type: "document",
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "selling", title: "Selling" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "details",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Web address",
      description: 'The end of the page address, e.g. melissasart.com/art/golden-hour-hills. Click "Generate".',
      type: "slug",
      group: "details",
      options: { source: "title", maxLength: 80 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "image",
      title: "Photo of the painting",
      description: "A web-sized photo or scan (at least 2000 pixels on the longest side). Crop out the edges so only the painting shows.",
      type: "image",
      group: "details",
      fields: [
        defineField({
          name: "alt",
          title: "Short description",
          description: "Describe the painting for people using screen readers, e.g. “Orange hills at sunset under a pink sky”.",
          type: "string",
        }),
      ],
      validation: (r) => r.required().warning("Add a photo. A colorful placeholder is shown until you do."),
    }),
    defineField({
      name: "year",
      type: "number",
      group: "details",
      initialValue: () => new Date().getFullYear(),
      validation: (r) => r.required().integer().min(1950).max(2100),
    }),
    defineField({
      name: "medium",
      type: "string",
      group: "details",
      description: "e.g. Acrylic on canvas",
      options: {
        list: ["Acrylic on canvas", "Oil on canvas", "Oil on panel", "Mixed media on canvas", "Watercolor on paper"],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "widthIn",
      title: "Width (inches)",
      type: "number",
      group: "details",
      description: "5 feet = 60 inches",
      validation: (r) => r.required().positive().max(240),
    }),
    defineField({
      name: "heightIn",
      title: "Height (inches)",
      type: "number",
      group: "details",
      validation: (r) => r.required().positive().max(240),
    }),
    defineField({
      name: "description",
      title: "The story behind it",
      description: "A few sentences about the painting. Leave a blank line between paragraphs.",
      type: "text",
      rows: 5,
      group: "details",
    }),
    defineField({
      name: "collections",
      type: "array",
      group: "details",
      of: [{ type: "reference", to: [{ type: "collection" }] }],
    }),
    defineField({
      name: "featured",
      title: "Feature on the home page",
      type: "boolean",
      group: "details",
      initialValue: false,
    }),

    // ---- Selling ----
    defineField({
      name: "status",
      title: "The original painting is…",
      type: "string",
      group: "selling",
      options: {
        list: [
          { title: "Available", value: "available" },
          { title: "Sold", value: "sold" },
          { title: "Not for sale (private collection)", value: "not-for-sale" },
        ],
        layout: "radio",
      },
      initialValue: "available",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "saleMode",
      title: "How should people buy it?",
      type: "string",
      group: "selling",
      options: {
        list: [
          { title: "Buy now: show the price with an “Add to cart” button", value: "buy-now" },
          { title: "Inquire: show the price, buyer sends a message", value: "inquire" },
          { title: "Inquire, price hidden: shows “Price on request”", value: "inquire-private" },
        ],
        layout: "radio",
      },
      initialValue: "buy-now",
      hidden: ({ document }) => document?.status !== "available",
      validation: (r) =>
        r.custom((mode, ctx) => {
          const doc = ctx.document as { status?: string; widthIn?: number; heightIn?: number } | undefined;
          const longest = Math.max(doc?.widthIn ?? 0, doc?.heightIn ?? 0);
          if (doc?.status === "available" && mode === "buy-now" && longest > LARGE_INCHES) {
            return {
              message: `Paintings over ${LARGE_INCHES}″ need a shipping quote. Consider “Inquire”, or set custom shipping prices below.`,
              level: "warning",
            };
          }
          return true;
        }),
    }),
    defineField({
      name: "price",
      title: "Price (USD)",
      description: "Whole dollars, e.g. 1850",
      type: "number",
      group: "selling",
      hidden: ({ document }) => document?.status !== "available" && document?.status !== "sold",
      validation: (r) =>
        r.min(1).custom((price, ctx) => {
          const doc = ctx.document as { status?: string; saleMode?: string } | undefined;
          if (doc?.status === "available" && doc.saleMode !== "inquire-private" && !price) {
            return "Add a price, or choose “Inquire, price hidden”.";
          }
          return true;
        }),
    }),
    defineField({
      name: "shipping",
      title: "Custom shipping price",
      description: "Optional. Leave empty to use the standard rates for this size.",
      type: "object",
      group: "selling",
      options: { collapsible: true, collapsed: true },
      hidden: ({ document }) => document?.status !== "available",
      fields: [
        defineField({ name: "us", title: "United States (USD)", type: "number", validation: (r) => r.min(0) }),
        defineField({ name: "intl", title: "International (USD)", type: "number", validation: (r) => r.min(0) }),
      ],
    }),
    defineField({
      name: "printsEnabled",
      title: "Sell prints of this painting",
      description: "Needs a high-resolution scan. Sizes are matched to the painting's shape automatically.",
      type: "boolean",
      group: "selling",
      initialValue: true,
    }),
  ],
  orderings: [
    { title: "Newest first", name: "yearDesc", by: [{ field: "year", direction: "desc" }] },
    { title: "Title", name: "title", by: [{ field: "title", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", year: "year", status: "status", media: "image" },
    prepare({ title, year, status, media }) {
      const label = status === "sold" ? " · Sold" : status === "not-for-sale" ? " · Not for sale" : "";
      return { title, subtitle: `${year ?? ""}${label}`, media };
    },
  },
});
