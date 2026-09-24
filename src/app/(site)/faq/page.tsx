import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { container } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about prints, original paintings, shipping and commissions.",
};

const faqs: { group: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    group: "Prints",
    items: [
      { q: "How are prints made?", a: "Each print is made from a professional high-resolution scan of the original by a local fine art printer, using archival inks on museum-grade paper or gallery canvas. Melissa then signs every print by hand." },
      { q: "Are prints framed?", a: "Fine art prints are shipped unframed with a small white border, ready for a standard frame. Stretched canvases arrive ready to hang." },
      { q: "How long do prints take?", a: "Prints are made for each order and usually ship from the studio within 1–2 weeks. Delivery time after that depends on your location." },
    ],
  },
  {
    group: "Original paintings",
    items: [
      { q: "Do originals come ready to hang?", a: "Yes. Every original is signed, varnished and wired for hanging, and comes with a certificate of authenticity." },
      { q: "Why do some paintings say “Inquire”?", a: "Large pieces and some special works are sold personally so we can arrange shipping, crating or installation for your location. Send an inquiry and Melissa will reply with details." },
      { q: "Can I see a painting in person?", a: <>Studio visits are available by appointment. <Link href="/contact" className="text-teal underline">Get in touch</Link> to arrange one.</> },
    ],
  },
  {
    group: "Shipping",
    items: [
      { q: "Do you ship internationally?", a: "Yes, we ship worldwide. Import duties and taxes charged by your country are paid by the buyer." },
      { q: "How are large paintings shipped?", a: "Paintings over 48 inches ship by custom crate or specialist art freight, fully insured. Shipping is quoted personally." },
      { q: "What if something arrives damaged?", a: <>Email a photo within 14 days of delivery and we&apos;ll make it right. See <Link href="/policies/shipping-returns" className="text-teal underline">Shipping &amp; Returns</Link>.</> },
    ],
  },
  {
    group: "Commissions",
    items: [
      { q: "How much does a commission cost?", a: <>It depends on size and detail. See the pricing guide on the <Link href="/commissions" className="text-teal underline">commissions page</Link>.</> },
      { q: "How long does a commission take?", a: "Usually 4–8 weeks from approved sketch to finished painting, depending on size and the studio calendar." },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="Help" title="Frequently asked questions" />
      <div className={`${container} max-w-3xl space-y-12`}>
        {faqs.map((g) => (
          <section key={g.group}>
            <h2 className="mb-4 font-display text-2xl text-terracotta-dark">{g.group}</h2>
            <div className="divide-y divide-line rounded-2xl border border-line bg-paper">
              {g.items.map((item) => (
                <details key={item.q} className="group px-6 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {item.q}
                    <span aria-hidden="true" className="text-xl text-teal transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <div className="mt-3 text-muted">{item.a}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
