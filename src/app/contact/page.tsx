import type { Metadata } from "next";
import { site } from "@/config/site";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { container } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.artistName} about paintings, prints, commissions or orders.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's talk"
        intro="Questions about a painting, an order, or working together? Send a note and you'll hear back within two business days."
      />
      <div className={`${container} grid gap-12 lg:grid-cols-3`}>
        <div className="rounded-2xl border border-line bg-paper p-6 sm:p-10 lg:col-span-2">
          <ContactForm />
        </div>
        <aside className="space-y-8">
          <div>
            <h2 className="font-display text-xl">Email</h2>
            <a href={`mailto:${site.email}`} className="text-teal underline-offset-4 hover:underline">{site.email}</a>
          </div>
          <div>
            <h2 className="font-display text-xl">Follow along</h2>
            <ul className="mt-1 space-y-1">
              <li><a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="text-teal underline-offset-4 hover:underline">Instagram</a></li>
              <li><a href={site.social.facebook} target="_blank" rel="noopener noreferrer" className="text-teal underline-offset-4 hover:underline">Facebook</a></li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl">Studio</h2>
            <p className="text-muted">{site.location}</p>
            <p className="text-sm text-muted">Studio visits by appointment.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
