import type { Metadata } from "next";
import { CommissionForm } from "@/components/forms/CommissionForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { container } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Commissions",
  description: "Commission a custom painting, from 12-inch studies to 5-foot statement pieces.",
};

const steps = [
  { title: "Share your idea", text: "Fill in the form below with the subject, size, colors and any reference photos." },
  { title: "Quote & sketch", text: "Melissa replies with a quote, timeline and a quick color sketch for your approval." },
  { title: "50% deposit", text: "A deposit reserves your spot on the studio calendar." },
  { title: "Painting begins", text: "You'll get progress photos along the way, with room for small adjustments." },
  { title: "Delivered", text: "The balance is paid when it's finished, then your painting is packed and shipped." },
];

// SAMPLE PRICING — to be set by Melissa.
const pricing = [
  { size: "12″ × 12″ – 16″ × 20″", from: "$450" },
  { size: "24″ × 30″ – 30″ × 40″", from: "$1,200" },
  { size: "36″ × 48″ – 4′ × 4′", from: "$2,800" },
  { size: "Up to 5′ × 5′", from: "$5,000" },
];

export default function CommissionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Commissions"
        title="A painting made just for you"
        intro="A favorite place, your garden in bloom, colors to match your home. Commissions are open for sizes from 12 inches up to 5 feet."
      />

      <section className={`${container} py-8`}>
        <SectionHeading title="How it works" color="text-teal" />
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-paper p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-marigold font-display text-lg font-semibold">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${container} grid gap-12 py-12 lg:grid-cols-3`}>
        <div className="lg:col-span-1">
          <SectionHeading title="Pricing guide" color="text-terracotta" />
          <table className="w-full text-left">
            <caption className="sr-only">Starting prices by size</caption>
            <thead>
              <tr className="border-b border-line text-sm text-muted">
                <th scope="col" className="py-2 font-semibold">Size</th>
                <th scope="col" className="py-2 font-semibold">Starting at</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((p) => (
                <tr key={p.size} className="border-b border-line">
                  <td className="py-3">{p.size}</td>
                  <td className="py-3 font-semibold">{p.from}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-muted">
            Final pricing depends on size and detail. Most commissions take 4–8 weeks. Shipping is quoted separately, and we ship worldwide.
          </p>
        </div>

        <div id="request" className="rounded-2xl border border-line bg-paper p-6 sm:p-10 lg:col-span-2">
          <h2 className="mb-6 font-display text-3xl">Request a commission</h2>
          <CommissionForm />
        </div>
      </section>
    </>
  );
}
