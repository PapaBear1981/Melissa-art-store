# Decisions for Melissa

Choices still needed before the store launches. Many answers are a quick change. Tick each box once it's decided and updated on the site.

Items marked **(dashboard)** are things she can change herself at `/studio`. Everything else needs a small code change, and the file to edit is listed.

---

## The basics

- [ ] **Store name.** Currently "Melissa's Art" (placeholder).
      `src/config/site.ts` → `name`, plus the title in `sanity.config.ts`
- [ ] **Tagline.** Currently "Original paintings & fine art prints, full of color."
      `src/config/site.ts` → `tagline`
- [ ] **Colors and fonts.** Warm palette (cream, terracotta, marigold, teal, plum) with Fraunces + Manrope. Does she like it?
      `src/app/globals.css` and `src/app/layout.tsx`
- [ ] **Home page headline.** "Paintings full of warmth and color."
      `src/app/(site)/page.tsx`

## Prints

- [ ] **Which materials?** Currently fine art paper and stretched canvas. Paper only? Framed?
      `src/lib/prints.ts` → `printMaterials`
- [ ] **Which sizes?** Sizes are picked to match each painting's shape (e.g. 8×10, 16×20, 24×30 for 4:5 paintings).
      `src/lib/prints.ts` → `sizesByRatio`
- [ ] **Print prices.** Estimates right now, from $45 (small paper) to $320 (large canvas). Should be based on her printer's cost plus her margin.
      `src/lib/prints.ts` → `priceTiers`
- [ ] **Print shipping.** Estimates: paper $9 US / $19 international, canvas $19 / $39, less for each extra print.
      `src/lib/prints.ts` → `printShipping`
- [ ] **Turnaround.** Site says prints ship in "about 1–2 weeks".
      `src/lib/prints.ts` → `printFulfillment`, also the FAQ, the shipping policy and the order email
- [ ] **Limited editions?** Numbered prints (e.g. "12/50") that sell out? Not built yet.

## Original paintings

- [ ] **Shipping rates by size** (US / international):
      small ≤16″ $25 / $75 · medium ≤30″ $60 / $175 · large ≤48″ $150 / $400
      `src/config/site.ts` → `originalShippingTiers`
- [ ] **Size that needs a personal quote.** Currently anything over 48″ (crating / art freight).
      `src/config/site.ts` → `quoteShippingAboveIn`
- [ ] **Shipping time.** Policy says originals ship "within 5 business days".
      `src/lib/policies.ts`, order email in `src/lib/orders/fulfill.ts`
- [ ] **Are these true?** The site claims every original is *signed, varnished, wired for hanging, and comes with a certificate of authenticity*.
      About page default text in `src/lib/content.ts`, FAQ in `src/app/(site)/faq/page.tsx`
- [ ] **Studio visits.** Site says "by appointment". OK?
      `src/app/(site)/contact/page.tsx`, FAQ

## Shipping and countries

- [ ] **Which countries to ship to.** Currently the US plus about 45 countries (Canada, UK, EU, Australia, Japan and others).
      `src/config/site.ts` → `internationalShippingCountries`
- [ ] **Customs duties** paid by the buyer (current wording). OK?

## Commissions

- [ ] **Starting prices by size.** Currently $450 / $1,200 / $2,800 / $5,000 (placeholders).
      `src/app/(site)/commissions/page.tsx` → `pricing`
- [ ] **Process.** Currently: quote & sketch → **50% deposit** → progress photos → balance on completion.
- [ ] **Timeline.** Site says "4–8 weeks".
- [ ] **Budget ranges** on the request form.
      `src/components/forms/CommissionForm.tsx`

## Policies (worth a careful read, maybe a professional check)

- [ ] **Returns on originals.** Currently 14 days, buyer pays return shipping.
- [ ] **Prints.** No change-of-mind returns; damaged prints replaced free within 14 days.
- [ ] **Commissions.** Non-refundable once the deposit is paid and work has started.
- [ ] **Privacy policy and terms** read through.
      All in `src/lib/policies.ts`
- [ ] **Reply time.** Contact page promises a reply "within 2 business days".

## Her content (dashboard)

- [ ] **About page** (dashboard): photo of her, intro, artist statement, "In the studio", exhibitions & news. The current text is a placeholder.
- [ ] **Contact details** (dashboard): public email, studio location, Instagram and Facebook links.
- [ ] **Paintings** (dashboard): photo, size, medium, year, story, price, and whether prints are sold.
- [ ] **Collections** (dashboard): names, descriptions, cover paintings.

## Money and email

- [ ] **Sales tax.** Turn on Stripe Tax (small fee per sale) or handle it another way? Ask an accountant.
- [ ] **Which inbox gets order emails?** Set `NOTIFICATION_EMAIL`.
- [ ] **Sending address**, e.g. `hello@herdomain.com`. Needs her domain verified in Resend, then set `EMAIL_FROM`.
- [ ] **Newsletter.** Signups currently just email her. Does she want a real mailing list tool?

## Accounts to hand over to her

- [ ] Sanity: invite her as Administrator (sanity.io/manage → Members)
- [ ] Stripe: account in her name (or business name) before switching to live payments
- [ ] Resend: account with her domain
- [ ] Domain: point it at the site host
