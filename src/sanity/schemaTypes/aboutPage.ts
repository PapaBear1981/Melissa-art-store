import { defineField, defineType } from "sanity";
import { site } from "@/config/site";

/** Where a button can point: a page on this site ("/gallery"), a web address or an email link. */
export function checkLink(value: string | undefined) {
  if (!value) return true;
  return /^(\/|https?:\/\/|mailto:)/.test(value) || 'Start with "/" for a page on this site (like /gallery) or "https://" for another website.';
}

const sectionTitle = (name: string, fallback: string) =>
  defineField({
    name,
    title: "Section heading",
    description: `Leave blank to use "${fallback}".`,
    type: "string",
  });

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  fieldsets: [
    { name: "statement", title: "Artist statement" },
    { name: "studio", title: "In the studio" },
    { name: "milestones", title: "Exhibitions & news" },
  ],
  fields: [
    defineField({
      name: "heading",
      title: "Page heading",
      description: `The big title at the top. Leave blank to use "Hi, I'm ${site.artistName}."`,
      type: "string",
    }),
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
    { ...sectionTitle("statementTitle", "Artist statement"), fieldset: "statement" },
    defineField({ name: "statement", title: "Text", type: "text", rows: 6, fieldset: "statement" }),
    { ...sectionTitle("studioTitle", "In the studio"), fieldset: "studio" },
    defineField({ name: "studio", title: "Text", type: "text", rows: 4, fieldset: "studio" }),
    { ...sectionTitle("milestonesTitle", "Exhibitions & news"), fieldset: "milestones" },
    defineField({
      name: "milestones",
      title: "Entries",
      type: "array",
      fieldset: "milestones",
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
    defineField({
      name: "buttons",
      title: "Buttons",
      description: "Shown under the text. The first one is filled in, the second is an outline. Leave empty to use \"See the work\" and \"Commission a painting\".",
      type: "array",
      validation: (r) => r.max(2),
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", title: "Button text", type: "string", validation: (r) => r.required() }),
            defineField({
              name: "link",
              title: "Goes to",
              description: "A page on this site like /gallery or /commissions, or a full web address.",
              type: "string",
              validation: (r) => r.required().custom(checkLink),
            }),
          ],
          preview: { select: { title: "label", subtitle: "link" } },
        },
      ],
    }),
    defineField({
      name: "seoDescription",
      title: "Search engine description",
      description: "One or two sentences Google and social media show under the page title. Leave blank to use a standard one.",
      type: "text",
      rows: 2,
      validation: (r) => r.max(200).warning("Search engines cut this off after about 160 characters."),
    }),
  ],
  preview: { prepare: () => ({ title: "About page" }) },
});
