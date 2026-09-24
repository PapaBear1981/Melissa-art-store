# Melissa's Art

Online store and portfolio for Melissa's paintings: original artwork, fine art prints (print-on-demand), a gallery, collections, commissions and contact.

> **Status: Phase 2 (content dashboard).** Paintings, collections, the About page and contact details are managed in the Sanity dashboard at `/studio`. Checkout and email delivery come in later phases (see the roadmap below).

## Tech stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- Cart stored in the visitor's browser (no accounts, guest checkout)
- Forms use Next.js Server Actions with `zod` validation
- **Sanity** content dashboard, embedded at `/studio` (project `8ii09o5j`, dataset `production`)
- Planned: **Stripe Checkout** + Stripe Tax, **Prodigi** (print-on-demand), **Resend** (email)

## Running locally

```bash
npm install
cp .env.example .env.local   # optional, see comments inside
npm run dev      # site: http://localhost:3000, dashboard: http://localhost:3000/studio
npm run lint
npm run build && npm start
```

Requires Node.js 20.9 or newer.

## Where things live

| Path | What it is |
| --- | --- |
| `src/config/site.ts` | Store name, email, social links, nav, original-painting shipping rates. **Rename the store here.** |
| `src/lib/data.ts` | The only place pages read content from |
| `src/lib/content.ts` | Loads content from Sanity and converts it for the site |
| `src/sanity/` | Dashboard setup: schemas (the fields she fills in), queries, menu, image loader |
| `sanity.config.ts` | Dashboard configuration |
| `src/lib/sample-data.ts` | Sample paintings (used by `npm run seed` and `USE_SAMPLE_CONTENT=true`) |
| `src/lib/types.ts` | The artwork data model (sale mode, status, prints, sizes) |
| `src/lib/prints.ts` | Print catalog: materials, sizes (matched to each painting's proportions) and retail prices |
| `src/lib/pricing.ts` | Price labels and original-painting shipping logic |
| `src/lib/cart/` | Cart store (localStorage) and React provider |
| `src/lib/forms/` | Contact, inquiry, commission and newsletter form handlers |
| `src/lib/policies.ts` | Shipping/returns, privacy and terms text (sample; review before launch) |
| `src/components/` | UI components (`art/`, `shop/`, `forms/`, `layout/`, `ui/`) |
| `src/app/` | Pages |

## How artwork is sold

Each painting has one record that controls where it shows up:

- **Original status**: `available`, `sold`, or `not-for-sale` (private collection). All appear in the Gallery; only available originals can be bought.
- **Sale mode** (for available originals):
  - `buy-now`: price shown, add to cart
  - `inquire`: price shown, customer sends an inquiry
  - `inquire-private`: "Price on request", customer sends an inquiry
- **Prints enabled**: offers fine art paper prints and stretched canvases, sized to match the painting's proportions. Sold paintings can still sell prints.
- **Shipping for originals**: flat rates by size (US and international) in `src/config/site.ts`. Paintings over 48″ show "shipping quoted personally". Each piece can override its own rates.

## Content dashboard (Sanity)

Go to `/studio` on the site and log in with the Sanity account. The menu has **Paintings**, **Collections**, **About page** and **Contact details**. Changes appear on the site within a minute of clicking **Publish** (instantly if the webhook below is set up). Paintings without a photo show a colorful placeholder.

### One-time setup at [sanity.io/manage](https://www.sanity.io/manage) → project → API

1. **CORS origins**: add each address the dashboard is opened from, with **Allow credentials** ticked:
   - `http://localhost:3000`
   - the Render address, e.g. `https://melissas-art.onrender.com`
   - later, the real domain
2. **Webhook** (optional, makes updates instant):
   - URL: `https://<site>/api/revalidate`
   - Dataset: `production`, trigger on create/update/delete
   - Secret: the same value as `SANITY_REVALIDATE_SECRET` on Render
3. **Members**: invite Melissa as **Administrator**. She can take over the project completely and remove the original account.

### Sample content

To try things out with the sample paintings, create an **Editor** token (API → Tokens), then:

```bash
SANITY_API_WRITE_TOKEN=... npm run seed             # add 12 sample paintings + 4 collections
SANITY_API_WRITE_TOKEN=... npm run seed -- --delete # remove them again
```

Sample documents all have IDs starting with `sample-`, so deleting them never touches real paintings.

## Deploying to Render

`render.yaml` is a Render Blueprint. In Render, choose **New → Blueprint**, pick this repo, and set `NEXT_PUBLIC_SITE_URL` to the site's public URL. Render generates `SANITY_REVALIDATE_SECRET`; copy it into the Sanity webhook. The free plan sleeps when idle, so the first visit after a while is slow. That's fine for development.

Nothing here is tied to one host, so the app can move to another Node host later.

## Roadmap

1. ✅ **Foundation**: design system, all pages, cart, forms, sample content
2. ✅ **Content dashboard**: Sanity Studio at `/studio` so Melissa can add paintings, collections, About page and contact details herself; images served from Sanity's CDN
3. **Payments**: Stripe Checkout, server-side price checks, automatic "mark as Sold" via webhook, order emails (Resend), form emails
4. **Fulfillment**: Prodigi API for prints, shipping rates, Stripe Tax
5. **Launch polish**: SEO/social previews, accessibility pass, custom domain, Stripe live mode
