import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { PageHeader } from "@/components/ui/PageHeader";
import { btn, container } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "About the artist",
  description: `Meet ${site.artistName}, the painter behind ${site.name}.`,
};

// SAMPLE CONTENT — Melissa will replace this with her own bio and photos.
const milestones = [
  { year: "2025", text: "Solo exhibition (example): Sample Gallery, Your City" },
  { year: "2024", text: "Group show (example): Local Art Center" },
  { year: "2023", text: "First large-scale commission (example)" },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title={`Hi, I'm ${site.artistName}.`} />
      <div className={`${container} grid gap-12 lg:grid-cols-12`}>
        <div className="lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-marigold via-terracotta to-plum">
            <p className="absolute inset-0 flex items-center justify-center p-8 text-center font-display text-xl text-white/90">
              Portrait of {site.artistName} in the studio
            </p>
          </div>
        </div>

        <div className="prose-warm text-lg lg:col-span-7">
          <p>
            I&apos;m a painter who can&apos;t stay away from color. My work moves between landscapes, loose florals and pure abstraction, but it always starts with the same thing: a feeling of warmth I want to hold onto.
          </p>
          <p>
            Most of my paintings are made in acrylic and oil, sometimes with oil pastel worked into the top layers. I paint everything from small 12-inch studies to five-foot canvases that fill a wall.
          </p>

          <h2>Artist statement</h2>
          <p>
            I paint to slow down. Late afternoon light, a jar of garden flowers, the way a warm orange buzzes next to a deep teal. These everyday moments are what I want people to live with. My hope is that each painting brings a little more light into the room it hangs in.
          </p>

          <h2>In the studio</h2>
          <p>
            Every original is signed, varnished and ready to hang, and ships with a certificate of authenticity. Prints are made from professional high-resolution scans of the originals so the colors stay true.
          </p>

          <h2>Exhibitions &amp; news</h2>
          <ul>
            {milestones.map((m) => (
              <li key={m.text}>
                <strong>{m.year}</strong>: {m.text}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/gallery" className={btn("primary")}>See the work</Link>
            <Link href="/commissions" className={btn("outline")}>Commission a painting</Link>
          </div>
        </div>
      </div>
    </>
  );
}
