import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Contact details",
  type: "document",
  fields: [
    defineField({
      name: "email",
      title: "Public email address",
      type: "string",
      validation: (r) => r.email(),
    }),
    defineField({ name: "location", title: "Studio location", description: "e.g. Asheville, North Carolina", type: "string" }),
    defineField({ name: "instagram", title: "Instagram link", type: "url" }),
    defineField({ name: "facebook", title: "Facebook link", type: "url" }),
  ],
  preview: { prepare: () => ({ title: "Contact details" }) },
});
