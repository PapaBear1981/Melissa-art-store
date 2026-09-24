/**
 * SAMPLE POLICY TEXT — a starting point only. Review and adjust before
 * launch (and consider having the privacy policy and terms checked).
 */
export interface Policy {
  slug: string;
  title: string;
  sections: { heading: string; paragraphs: string[] }[];
}

export const policies: Policy[] = [
  {
    slug: "shipping-returns",
    title: "Shipping & Returns",
    sections: [
      {
        heading: "Original paintings",
        paragraphs: [
          "Originals are wrapped, boxed with corner protection and shipped fully insured with tracking from the studio, usually within 5 business days.",
          "Paintings larger than 48 inches ship by crate or specialist art freight. Shipping is quoted personally for your address.",
        ],
      },
      {
        heading: "Prints and canvases",
        paragraphs: [
          "Each print is made by a local fine art printer, hand-signed, and shipped from the studio, usually within 1–2 weeks.",
        ],
      },
      {
        heading: "International orders",
        paragraphs: [
          "We ship worldwide. Any import duties, taxes or customs fees charged by your country are the buyer's responsibility.",
        ],
      },
      {
        heading: "Returns",
        paragraphs: [
          "Originals can be returned within 14 days of delivery in their original condition and packaging. The buyer pays return shipping.",
          "Prints are made to order, so they can't be returned for change of mind. If your print arrives damaged or has a printing flaw, email us a photo within 14 days and we'll replace it free of charge.",
          "Commissioned paintings are custom work and are non-refundable once the deposit is paid and work has started.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    sections: [
      {
        heading: "What we collect",
        paragraphs: [
          "When you order, we collect your name, email and shipping address to fulfill it. Payments are handled by Stripe, and we never see or store your full card number.",
          "When you use a contact or commission form, we keep what you send so we can reply.",
        ],
      },
      {
        heading: "Who we share it with",
        paragraphs: [
          "Only the services needed to run the shop: Stripe (payments), our shipping carriers and our email provider. We never sell your information.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You can unsubscribe from the newsletter at any time, or email us to see or delete the information we hold about you.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Sale",
    sections: [
      {
        heading: "Artwork & copyright",
        paragraphs: [
          "The artist keeps full copyright of all artwork. Buying an original or print doesn't include the right to reproduce the image.",
        ],
      },
      {
        heading: "Colors & images",
        paragraphs: [
          "We photograph and scan every painting carefully, but colors can look slightly different from screen to screen.",
        ],
      },
      {
        heading: "Pricing",
        paragraphs: ["Prices are in US dollars. Shipping and any applicable taxes are shown at checkout."],
      },
    ],
  },
];
