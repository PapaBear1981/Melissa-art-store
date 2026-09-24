import "server-only";
import { createClient, type QueryParams } from "next-sanity";
import { apiVersion, dataset, projectId, revalidateSeconds } from "./env";

/**
 * The dataset is private (it holds orders and commission requests with
 * customer details), so the site reads with a server-side token. A
 * read-only "Viewer" token is enough; the Editor token also works.
 */
const token = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN;

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
  token,
});

/** Cache tag cleared by the /api/revalidate webhook when content is published. */
export const SANITY_TAG = "sanity";

export function sanityFetch<T>(query: string, params: QueryParams = {}): Promise<T> {
  return client.fetch<T>(query, params, {
    next: { revalidate: revalidateSeconds, tags: [SANITY_TAG] },
  });
}

/** Uncached read straight from the API, for checkout (prices and availability). */
export function sanityFetchFresh<T>(query: string, params: QueryParams = {}): Promise<T> {
  return client.withConfig({ useCdn: false }).fetch<T>(query, params, { cache: "no-store" });
}
