import { defineField, defineType } from "sanity";

export const collection = defineType({
  name: "collection",
  title: "Collection",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Web address",
      type: "slug",
      options: { source: "title", maxLength: 80 },
      validation: (r) =>
        r.required().custom((slug) =>
          slug?.current === "archive" ? "“archive” is taken by the Archive page. Pick another web address." : true,
        ),
    }),
    defineField({
      name: "summary",
      description: "One short line shown on collection cards.",
      type: "string",
      validation: (r) => r.required().max(120),
    }),
    defineField({
      name: "description",
      description: "Shown at the top of the collection page. Leave a blank line between paragraphs.",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "cover",
      title: "Cover painting",
      type: "reference",
      to: [{ type: "artwork" }],
    }),
    defineField({
      name: "order",
      title: "Display order",
      description: "Lower numbers show first.",
      type: "number",
      initialValue: 10,
    }),
  ],
  orderings: [{ title: "Display order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "summary", media: "cover.image" } },
});
