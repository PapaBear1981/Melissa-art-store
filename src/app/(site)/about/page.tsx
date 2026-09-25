import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { getAbout } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { btn, container } from "@/components/ui/styles";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout();
  return { title: "About the artist", description: about.seoDescription };
}

export default async function AboutPage() {
  const about = await getAbout();

  return (
    <>
      <PageHeader eyebrow="About" title={about.heading} />
      <div className={`${container} grid gap-12 lg:grid-cols-12`}>
        <div className="lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-marigold via-terracotta to-plum">
            {about.portrait ? (
              <Image
                src={about.portrait.src}
                alt={about.portrait.alt}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                placeholder={about.portrait.lqip ? "blur" : "empty"}
                blurDataURL={about.portrait.lqip}
                className="object-cover"
              />
            ) : (
              <p className="absolute inset-0 flex items-center justify-center p-8 text-center font-display text-xl text-white/90">
                Portrait of {site.artistName} in the studio
              </p>
            )}
          </div>
        </div>

        <div className="prose-warm text-lg lg:col-span-7">
          {about.intro.map((p) => <p key={p}>{p}</p>)}

          {about.statement.length > 0 && (
            <>
              <h2>{about.statementTitle}</h2>
              {about.statement.map((p) => <p key={p}>{p}</p>)}
            </>
          )}

          {about.studio.length > 0 && (
            <>
              <h2>{about.studioTitle}</h2>
              {about.studio.map((p) => <p key={p}>{p}</p>)}
            </>
          )}

          {about.milestones.length > 0 && (
            <>
              <h2>{about.milestonesTitle}</h2>
              <ul>
                {about.milestones.map((m) => (
                  <li key={`${m.year}-${m.text}`}>
                    {m.year && <strong>{m.year}: </strong>}
                    {m.text}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {about.buttons.map((b, i) => (
              <Link key={`${b.link}-${b.label}`} href={b.link} className={btn(i === 0 ? "primary" : "outline")}>
                {b.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
