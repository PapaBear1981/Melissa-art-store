import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { getAbout, getCollectionCover, getCollections, getFeaturedArtworks, getShopArtworks } from "@/lib/data";
import { ArtworkImage } from "@/components/art/ArtworkImage";
import { ArtworkCard } from "@/components/art/ArtworkCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { btn, container } from "@/components/ui/styles";

export default async function HomePage() {
  const [featured, shop, collections, about] = await Promise.all([
    getFeaturedArtworks(),
    getShopArtworks(),
    getCollections(),
    getAbout(),
  ]);
  const hero = featured[0];
  const heroSide = featured.slice(1, 3);
  const newWork = shop.filter((a) => a.original.status === "available").slice(0, 4);
  const collectionCovers = await Promise.all(collections.map((c) => getCollectionCover(c)));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-marigold/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-terracotta/15 blur-3xl" />
        <div className={`${container} relative grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-24`}>
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-terracotta-dark">
              Original paintings · Fine art prints · Commissions
            </p>
            <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Paintings full of <span className="italic text-terracotta-dark">warmth</span> and{" "}
              <span className="italic text-teal">color</span>.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted">
              Hand-painted originals from 12 inches to 5 feet, plus museum-quality prints shipped to your door, anywhere in the world.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className={btn("primary")}>Shop the art</Link>
              <Link href="/gallery" className={btn("outline")}>Explore the gallery</Link>
            </div>
          </div>
          {hero && (
            <div className="grid grid-cols-5 items-center gap-4">
              <Link href={`/art/${hero.slug}`} className="col-span-3 -rotate-1 transition hover:rotate-0">
                <ArtworkImage artwork={hero} priority sizes="(min-width: 1024px) 30vw, 60vw" className="rounded-sm shadow-2xl" />
              </Link>
              <div className="col-span-2 space-y-4">
                {heroSide.map((a, i) => (
                  <Link key={a.slug} href={`/art/${a.slug}`} className={`block transition hover:rotate-0 ${i ? "-rotate-2" : "rotate-2"}`}>
                    <ArtworkImage artwork={a} priority sizes="20vw" className="rounded-sm shadow-xl" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Collections */}
      {collections.length > 0 && (
      <section className={`${container} py-16`}>
        <SectionHeading title="Collections" href="/gallery#collections" linkLabel="All collections" />
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {collections.map((c, i) => {
            const cover = collectionCovers[i];
            return (
              <li key={c.slug}>
                <Link href={`/gallery/${c.slug}`} className="group block">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl">
                    {cover && (
                      <div className="h-full w-full transition duration-500 group-hover:scale-105">
                        <ArtworkImage artwork={cover} fit="fill" sizes="(min-width: 1024px) 25vw, 50vw" />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 font-display text-xl group-hover:text-terracotta-dark sm:text-2xl">{c.title}</h3>
                  <p className="text-sm text-muted">{c.summary}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
      )}

      {/* Available now */}
      {newWork.length > 0 && (
      <section className="bg-paper py-16">
        <div className={container}>
          <SectionHeading title="Available now" href="/shop" linkLabel="Visit the shop" color="text-terracotta" />
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {newWork.map((a) => (
              <li key={a.slug}>
                <ArtworkCard artwork={a} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {/* Prints + Commissions */}
      <section className={`${container} grid gap-6 py-16 md:grid-cols-2`}>
        <div className="rounded-3xl bg-teal p-10 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-marigold">Fine art prints</p>
          <h2 className="mt-3 font-display text-3xl">Every painting, ready for your wall</h2>
          <p className="mt-4 text-white/85">
            Hand-signed prints on archival paper or stretched canvas, in sizes from 8″ to 40″, shipped worldwide.
          </p>
          <Link href="/shop" className={`${btn("outline")} mt-8 border-transparent`}>Shop prints</Link>
        </div>
        <div className="rounded-3xl bg-plum p-10 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-marigold">Commissions</p>
          <h2 className="mt-3 font-display text-3xl">A painting made just for you</h2>
          <p className="mt-4 text-white/85">
            Your favorite place, your garden, your colors. From small studies to five-foot statement pieces.
          </p>
          <Link href="/commissions" className={`${btn("outline")} mt-8 border-transparent`}>Start a commission</Link>
        </div>
      </section>

      {/* About teaser */}
      <section className={`${container} grid items-center gap-12 py-16 md:grid-cols-2`}>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] bg-gradient-to-br from-marigold via-terracotta to-plum">
          {about.portrait ? (
            <Image
              src={about.portrait.src}
              alt={about.portrait.alt}
              fill
              sizes="(min-width: 768px) 24rem, 100vw"
              placeholder={about.portrait.lqip ? "blur" : "empty"}
              blurDataURL={about.portrait.lqip}
              className="object-cover"
            />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center p-8 text-center font-display text-xl text-white/90">
              Photo of {site.artistName} in the studio
            </p>
          )}
        </div>
        <div>
          <SectionHeading title={`Hi, I'm ${site.artistName}`} color="text-teal" />
          <p className="text-lg text-muted">
            {about.intro[0]}
          </p>
          <Link href="/about" className={`${btn("outline")} mt-8`}>About the artist</Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className={`${container} pb-8`}>
        <div className="rounded-3xl bg-blush px-8 py-12 text-center sm:px-16">
          <h2 className="font-display text-3xl">Be first to see new work</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            New paintings go to the studio list before they reach the shop. A few emails a year, no spam.
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
