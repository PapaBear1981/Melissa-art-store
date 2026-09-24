import { defineField, defineType } from "sanity";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  fields: [
    defineField({
      name: "portrait",
      title: "Photo of you",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Short description", type: "string" })],
    }),
    defineField({
      name: "intro",
      title: "Introduction",
      description: "Leave a blank line between paragraphs.",
      type: "text",
      rows: 6,
    }),
    defineField({ name: "statement", title: "Artist statement", type: "text", rows: 6 }),
    defineField({ name: "studio", title: "In the studio", type: "text", rows: 4 }),
    defineField({
      name: "milestones",
      title: "Exhibitions & news",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "year", type: "string" }),
            defineField({ name: "text", title: "Description", type: "string" }),
          ],
          preview: { select: { title: "text", subtitle: "year" } },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "About page" }) },
});
