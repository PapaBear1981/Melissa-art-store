import "server-only";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/**
 * Server-only client that can change content (mark paintings sold, save
 * orders and commission requests). Needs SANITY_API_WRITE_TOKEN with
 * Editor permission. Returns null when the token isn't set.
 */
export function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) return null;
  return createClient({ projectId, dataset, apiVersion, token, useCdn: false });
}
