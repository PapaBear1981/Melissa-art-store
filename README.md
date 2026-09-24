# Melissa's Art

Online store and portfolio for Melissa's paintings: original artwork, fine art prints (print-on-demand), a gallery, collections, commissions and contact.

> **Status: Phase 1 (foundation).** Every page is built and working with **sample paintings and placeholder text**. Checkout, email delivery and the content dashboard come in later phases (see the roadmap below).

## Tech stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- Cart stored in the visitor's browser (no accounts, guest checkout)
- Forms use Next.js Server Actions with `zod` validation
- Planned: **Sanity** (content dashboard), **Stripe Checkout** + Stripe Tax, **Prodigi** (print-on-demand), **Resend** (email)

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build && npm start
```

Requires Node.js 20.9 or newer.

## Where things live

| Path | What it is |
| --- | --- |
| `src/config/site.ts` | Store name, email, social links, nav, original-painting shipping rates. **Rename the store here.** |
| `src/lib/sample-data.ts` | Sample paintings and collections (replaced by Sanity in Phase 2) |
| `src/lib/data.ts` | The only place pages read content from, so swapping in Sanity touches one file |
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

## Deploying to Render

`render.yaml` is a Render Blueprint. In Render, choose **New → Blueprint**, pick this repo, and set `NEXT_PUBLIC_SITE_URL` to the site's public URL. The free plan sleeps when idle, so the first visit after a while is slow. That's fine for development.

Nothing here is tied to one host, so the app can move to another Node host later.

## Roadmap

1. ✅ **Foundation**: design system, all pages, cart, forms, sample content
2. **Content dashboard**: Sanity Studio at `/studio` so Melissa can add paintings, collections and page text herself; real image hosting
3. **Payments**: Stripe Checkout, server-side price checks, automatic "mark as Sold" via webhook, order emails (Resend), form emails
4. **Fulfillment**: Prodigi API for prints, shipping rates, Stripe Tax
5. **Launch polish**: SEO/social previews, accessibility pass, custom domain, Stripe live mode
