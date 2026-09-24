import type { StructureResolver } from "sanity/structure";

/** The dashboard's left-hand menu. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Melissa's Art")
    .items([
      S.documentTypeListItem("artwork").title("Paintings"),
      S.documentTypeListItem("collection").title("Collections"),
      S.divider(),
      S.listItem()
        .title("About page")
        .id("aboutPage")
        .child(S.document().schemaType("aboutPage").documentId("aboutPage")),
      S.listItem()
        .title("Contact details")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
    ]);
