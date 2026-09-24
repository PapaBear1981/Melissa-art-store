import { defineQuery } from "next-sanity";

const artworkFields = /* groq */ `
  "slug": slug.current,
  title,
  year,
  medium,
  widthIn,
  heightIn,
  description,
  featured,
  status,
  saleMode,
  price,
  shipping,
  printsEnabled,
  "collections": collections[]->slug.current,
  "image": image{
    alt,
    "url": asset->url,
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height,
    "lqip": asset->metadata.lqip
  }
`;

export const artworksQuery = defineQuery(`
  *[_type == "artwork" && defined(slug.current)] | order(year desc, _createdAt desc) { ${artworkFields} }
`);

export const artworksBySlugQuery = defineQuery(`
  *[_type == "artwork" && slug.current in $slugs] { ${artworkFields} }
`);

export const collectionsQuery = defineQuery(`
  *[_type == "collection" && defined(slug.current)] | order(order asc, title asc) {
    "slug": slug.current,
    title,
    summary,
    description,
    "cover": cover->slug.current
  }
`);

export const aboutPageQuery = defineQuery(`
  *[_id == "aboutPage"][0]{
    intro,
    statement,
    studio,
    milestones[]{ year, text },
    "portrait": portrait{
      alt,
      "url": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
      "lqip": asset->metadata.lqip
    }
  }
`);

export const siteSettingsQuery = defineQuery(`
  *[_id == "siteSettings"][0]{ email, location, instagram, facebook }
`);
