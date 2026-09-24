/** Sanity connection settings. The project ID is public, so it has a default. */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "8ii09o5j";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2025-09-01";

/** Seconds before published changes show on the site (if no webhook is set up). */
export const revalidateSeconds = 60;
