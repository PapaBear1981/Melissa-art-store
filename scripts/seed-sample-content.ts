/**
 * Loads the sample paintings and collections into Sanity so you can see
 * how the dashboard and site work together. Every sample document's ID
 * starts with "sample-", so they're easy to remove again.
 *
 *   SANITY_API_WRITE_TOKEN=... npm run seed           # add samples
 *   SANITY_API_WRITE_TOKEN=... npm run seed -- --delete  # remove samples
 *
 * Create the token at sanity.io/manage → API → Tokens (Editor permission).
 */
import { createClient } from "@sanity/client";
import { sampleArtworks, sampleCollections } from "../src/lib/sample-data.ts";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("Set SANITY_API_WRITE_TOKEN first (sanity.io/manage → API → Tokens, Editor).");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "8ii09o5j",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-09-01",
  token,
  useCdn: false,
});

const ref = (id: string, key?: string) => ({ _type: "reference", _ref: id, ...(key ? { _key: key } : {}) });

async function remove() {
  const ids = await client.fetch<string[]>(`*[_id match "sample-*"]._id`);
  // Collections reference paintings, so delete them first.
  const tx = client.transaction();
  ids.filter((id) => id.startsWith("sample-collection-")).forEach((id) => tx.delete(id));
  await tx.commit();
  const tx2 = client.transaction();
  ids.filter((id) => !id.startsWith("sample-collection-")).forEach((id) => tx2.delete(id));
  await tx2.commit();
  console.log(`Removed ${ids.length} sample documents.`);
}

async function seed() {
  const tx = client.transaction();
  for (const a of sampleArtworks) {
    tx.createOrReplace({
      _id: `sample-art-${a.slug}`,
      _type: "artwork",
      title: a.title,
      slug: { _type: "slug", current: a.slug },
      year: a.year,
      medium: a.medium,
      widthIn: a.widthIn,
      heightIn: a.heightIn,
      description: a.description.join("\n\n"),
      collections: a.collections.map((c) => ref(`sample-collection-${c}`, c)),
      featured: a.featured ?? false,
      status: a.original.status,
      saleMode: a.original.saleMode,
      price: a.original.price ? a.original.price / 100 : undefined,
      printsEnabled: a.printsEnabled,
    });
  }
  sampleCollections.forEach((c, i) => {
    tx.createOrReplace({
      _id: `sample-collection-${c.slug}`,
      _type: "collection",
      title: c.title,
      slug: { _type: "slug", current: c.slug },
      summary: c.summary,
      description: c.description.join("\n\n"),
      cover: ref(`sample-art-${c.cover}`),
      order: (i + 1) * 10,
    });
  });
  await tx.commit();
  console.log(`Added ${sampleArtworks.length} sample paintings and ${sampleCollections.length} collections.`);
}

await (process.argv.includes("--delete") ? remove() : seed());
