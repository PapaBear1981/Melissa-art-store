/**
 * Site-wide settings. Renaming the store later only needs changes here.
 */
export const site = {
  name: "Melissa's Art",
  artistName: "Melissa",
  tagline: "Original paintings & fine art prints, full of color.",
  description:
    "Original paintings, fine art prints and custom commissions by Melissa. Shipped worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "hello@example.com",
  location: "Studio location, USA",
  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
  },
  currency: "USD",
} as const;

export const mainNav = [
  { href: "/gallery", label: "Gallery" },
  { href: "/collections", label: "Collections" },
  { href: "/shop", label: "Shop" },
  { href: "/commissions", label: "Commissions" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const footerNav = [
  { href: "/faq", label: "FAQ" },
  { href: "/policies/shipping-returns", label: "Shipping & Returns" },
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/policies/terms", label: "Terms" },
] as const;

/**
 * Shipping estimates for ORIGINAL paintings, by the painting's longest side.
 * Prints are shipped by the print partner and priced separately.
 * Prices in cents (USD).
 */
export const originalShippingTiers = [
  { maxLongestSideIn: 16, label: "Small", us: 2500, intl: 7500 },
  { maxLongestSideIn: 30, label: "Medium", us: 6000, intl: 17500 },
  { maxLongestSideIn: 48, label: "Large", us: 15000, intl: 40000 },
] as const;

/** Above this size, shipping is quoted personally (crating / freight). */
export const quoteShippingAboveIn = 48;

/**
 * Countries we ship to outside the US (ISO codes). Stripe Checkout only
 * accepts addresses in this list for international orders.
 */
export const internationalShippingCountries = [
  "CA", "MX", "GB", "IE", "FR", "DE", "NL", "BE", "LU", "AT", "CH", "IT", "ES", "PT",
  "DK", "SE", "NO", "FI", "IS", "PL", "CZ", "SK", "SI", "HR", "HU", "RO", "BG", "GR",
  "EE", "LV", "LT", "MT", "CY", "AU", "NZ", "JP", "KR", "SG", "HK", "TW", "IL", "AE",
  "ZA", "BR", "CL", "CO", "PR",
] as const;
