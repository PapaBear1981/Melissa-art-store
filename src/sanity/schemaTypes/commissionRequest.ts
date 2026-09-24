import { defineField, defineType } from "sanity";

/** Created by the commission form on the website. */
export const commissionRequest = defineType({
  name: "commissionRequest",
  title: "Commission request",
  type: "document",
  fields: [
    defineField({
      name: "status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Quoted", value: "quoted" },
          { title: "In progress", value: "in-progress" },
          { title: "Done", value: "done" },
          { title: "Declined", value: "declined" },
        ],
        layout: "radio",
      },
      initialValue: "new",
    }),
    defineField({ name: "notes", title: "Private notes", type: "text", rows: 3 }),
    defineField({ name: "receivedAt", title: "Received", type: "datetime", readOnly: true }),
    defineField({ name: "name", type: "string", readOnly: true }),
    defineField({ name: "email", type: "string", readOnly: true }),
    defineField({ name: "size", type: "string", readOnly: true }),
    defineField({ name: "customSize", type: "string", readOnly: true }),
    defineField({ name: "subject", title: "What they'd like painted", type: "text", readOnly: true }),
    defineField({ name: "colors", title: "Colors or mood", type: "string", readOnly: true }),
    defineField({ name: "budget", type: "string", readOnly: true }),
    defineField({ name: "deadline", title: "Needed by", type: "string", readOnly: true }),
    defineField({ name: "shipTo", title: "Ships to", type: "string", readOnly: true }),
    defineField({ name: "customerNotes", title: "Their notes", type: "text", readOnly: true }),
    defineField({ name: "photos", title: "Reference photos", type: "array", readOnly: true, of: [{ type: "image" }] }),
  ],
  orderings: [{ title: "Newest first", name: "receivedDesc", by: [{ field: "receivedAt", direction: "desc" }] }],
  preview: {
    select: { title: "name", size: "size", status: "status", media: "photos.0" },
    prepare: ({ title, size, status, media }) => ({ title, subtitle: `${status ?? "new"} · ${size ?? ""}`, media }),
  },
});
