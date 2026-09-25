import { describe, expect, it } from "vitest";
import { aboutPageQuery, artworksBySlugQuery, artworksQuery, collectionsQuery, siteSettingsQuery } from "./queries";

const artworkProjection = ['"slug": slug.current', "price", "shipping", "printsEnabled", '"collections": collections[]->slug.current', '"url": asset->url'];

describe("GROQ queries", () => {
  it("loads every artwork with a slug, newest first", () => {
    expect(artworksQuery).toContain('*[_type == "artwork" && defined(slug.current)] | order(year desc, _createdAt desc)');
    for (const field of artworkProjection) expect(artworksQuery).toContain(field);
  });

  it("loads artworks by slug with the same fields", () => {
    expect(artworksBySlugQuery).toContain('*[_type == "artwork" && slug.current in $slugs]');
    for (const field of artworkProjection) expect(artworksBySlugQuery).toContain(field);
  });

  it("loads collections in display order with the cover's slug", () => {
    expect(collectionsQuery).toContain("order(order asc, title asc)");
    expect(collectionsQuery).toContain('"cover": cover->slug.current');
  });

  it("loads the singleton About and settings documents by id", () => {
    expect(aboutPageQuery).toContain('*[_id == "aboutPage"][0]');
    expect(aboutPageQuery).toContain("milestones[]{ year, text }");
    expect(siteSettingsQuery).toContain('*[_id == "siteSettings"][0]{ email, location, instagram, facebook }');
  });
});
