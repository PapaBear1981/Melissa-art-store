import Link from "next/link";
import { footerNav, mainNav, site } from "@/config/site";
import { container } from "@/components/ui/styles";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { getSiteSettings } from "@/lib/data";

export async function Footer() {
  const settings = await getSiteSettings();
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className={`${container} grid gap-12 py-16 md:grid-cols-12`}>
        <div className="md:col-span-5">
          <p className="font-display text-3xl">{site.name}</p>
          <p className="mt-3 max-w-sm text-cream/75">{site.tagline}</p>
          <div className="mt-8 max-w-sm">
            <p className="mb-3 text-sm font-semibold">
              New paintings, first. Join the studio list.
            </p>
            <NewsletterForm tone="dark" />
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:col-span-4">
          <ul className="space-y-2 text-sm">
            {mainNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-cream/80 hover:text-marigold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="space-y-2 text-sm">
            {footerNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-cream/80 hover:text-marigold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-sm md:col-span-3">
          <p className="font-semibold">Say hello</p>
          <a href={`mailto:${settings.email}`} className="mt-2 block text-cream/80 hover:text-marigold">
            {settings.email}
          </a>
          <div className="mt-4 flex gap-4">
            {settings.instagram && (
              <a href={settings.instagram} className="text-cream/80 hover:text-marigold" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            )}
            {settings.facebook && (
              <a href={settings.facebook} className="text-cream/80 hover:text-marigold" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            )}
          </div>
          <p className="mt-6 text-cream/60">Shipping across the US and worldwide.</p>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <p className={`${container} py-6 text-xs text-cream/60`}>
          © {new Date().getFullYear()} {site.name}. All artwork © {site.artistName}. Images may not be reproduced without permission.
        </p>
      </div>
    </footer>
  );
}
