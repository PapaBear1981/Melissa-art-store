<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project notes

- Pages read content only through `src/lib/data.ts`, which loads from Sanity via `src/lib/content.ts`.
- Prices are integers in cents (USD) in the app; the Sanity dashboard stores whole dollars and `content.ts` converts.
- Public site pages live in the `src/app/(site)` route group; `/studio` sits outside it so the dashboard has no site header.
- Placeholder content: `src/lib/sample-data.ts`, `src/lib/policies.ts`, default About text in `content.ts`, commission pricing.
- Never trust prices from the browser: checkout re-prices everything in `src/lib/checkout/order.ts` from fresh Sanity data.
