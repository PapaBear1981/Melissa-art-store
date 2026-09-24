# Melissa's Art

Online store and portfolio for Melissa's paintings: original artwork, hand-signed fine art prints, a gallery, collections, commissions and contact.

> **Status: Phase 3 (payments).** Content is managed in the Sanity dashboard at `/studio`. Checkout runs on Stripe (test mode during development), paid originals are marked Sold automatically, and orders and form messages are emailed via Resend. Prints are hand-signed and fulfilled by Melissa; print orders arrive by email and in the dashboard.

## Tech stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- Cart stored in the visitor's browser (no accounts, guest checkout)
- Forms use Next.js Server Actions with `zod` validation
- **Sanity** content dashboard, embedded at `/studio` (project `8ii09o5j`, dataset `production`)
- **Stripe Checkout** for payments, **Resend** for email

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
| `src/lib/checkout/` | Server-side order pricing (`order.ts`) and the Stripe Checkout action |
| `src/lib/orders/fulfill.ts` | After payment: save order, mark originals sold, send emails |
| `src/app/api/stripe/webhook` | Receives payment confirmations from Stripe |
| `src/lib/email.ts` | Sends email through Resend (logs instead when not configured) |
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

## Payments (Stripe)

Checkout uses Stripe's hosted page, so card details never touch this site. The customer picks **United States** or **Another country** in the cart; the server re-checks every price and availability from the dashboard, adds shipping, and opens Stripe Checkout (valid for 30 minutes).

- **Originals:** shipping by size tier from `src/config/site.ts`, or the painting's custom shipping price. Pieces over 48″ without a custom price can't be bought online.
- **Prints:** per-order rates in `src/lib/prints.ts` (`printShipping`). These are estimates, so adjust them to real postage costs.
- **Allowed countries:** `internationalShippingCountries` in `src/config/site.ts`.

After payment, Stripe calls `/api/stripe/webhook`, which:
1. saves the order under **Orders** in the dashboard,
2. marks each original **Sold** (and flags the order if it had already sold),
3. emails Melissa and the customer.

### Setup (test mode is free)

1. Create a Stripe account; stay in **Test mode**. Copy the `sk_test_…` secret key into `STRIPE_SECRET_KEY`.
2. Create an Editor token in Sanity and set `SANITY_API_WRITE_TOKEN`, so the webhook can mark paintings sold.
3. Webhook, deployed site: Stripe → Developers → Webhooks → **Add endpoint** `https://<site>/api/stripe/webhook`, events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Webhook, local testing: install the Stripe CLI and run `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Use the `whsec_…` it prints.
5. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC.

Before going live: activate the Stripe account, switch to live keys, create a live webhook, and decide on sales tax (`STRIPE_AUTOMATIC_TAX=true` after setting up Stripe Tax).

## Email (Resend)

Set `RESEND_API_KEY` (free plan). Until her domain is verified in Resend, emails send from `onboarding@resend.dev` and only reach the Resend account's own address. That's fine for testing. After verifying the domain, set `EMAIL_FROM` (e.g. `Melissa's Art <hello@herdomain.com>`) and `NOTIFICATION_EMAIL`. Without a key, emails are written to the server log instead.

Form emails have **Reply-To** set to the sender, so replying goes straight to the customer. Commission requests (with reference photos) are also saved under **Commission requests** in the dashboard.

## Deploying to Render

`render.yaml` is a Render Blueprint. In Render, choose **New → Blueprint**, pick this repo, and set `NEXT_PUBLIC_SITE_URL` to the site's public URL. Render generates `SANITY_REVALIDATE_SECRET`; copy it into the Sanity webhook. The free plan sleeps when idle, so the first visit after a while is slow. That's fine for development.

Nothing here is tied to one host, so the app can move to another Node host later.

## Roadmap

1. ✅ **Foundation**: design system, all pages, cart, forms, sample content
2. ✅ **Content dashboard**: Sanity Studio at `/studio` so Melissa can add paintings, collections, About page and contact details herself; images served from Sanity's CDN
3. ✅ **Payments**: Stripe Checkout, server-side price checks, automatic "mark as Sold" via webhook, orders and commission requests in the dashboard, order and form emails (Resend)
4. **Pricing check**: real print prices and postage, Stripe Tax decision
5. **Launch polish**: SEO/social previews, accessibility pass, custom domain, Stripe live mode
