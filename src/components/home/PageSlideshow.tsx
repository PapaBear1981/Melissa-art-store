"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { ArtImage, Artwork } from "@/lib/types";
import { ArtworkImage } from "@/components/art/ArtworkImage";
import { btn } from "@/components/ui/styles";
import { site } from "@/config/site";

export type Slide = {
  href: string;
  label: string;
  title: string;
  text: string;
  cta: string;
  /** Tailwind text/background color pair for this slide's accents. */
  accent: { text: string; bg: string };
  artwork?: Artwork;
  photo?: ArtImage;
};

/** How long each slide stays up before moving on. */
const SLIDE_MS = 7000;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const prefersReducedMotion = () => window.matchMedia(reducedMotionQuery).matches;
const subscribeReducedMotion = (onChange: () => void) => {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

export function PageSlideshow({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  // Respect "reduce motion": start paused so nothing moves on its own.
  const reduceMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const [pausedChoice, setPausedChoice] = useState<boolean | null>(null);
  const userPaused = pausedChoice ?? reduceMotion;
  const [hovered, setHovered] = useState(false);
  const running = !userPaused && !hovered;

  const go = (i: number) => setIndex((i + slides.length) % slides.length);

  return (
    <section
      data-fit-screen
      aria-roledescription="carousel"
      aria-label="Explore the site"
      className="relative flex w-full flex-col overflow-hidden"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <h1 className="sr-only">{site.name}: {site.tagline}</h1>

      <div className="relative min-h-0 flex-1" aria-live={running ? "off" : "polite"}>
        {slides.map((s, i) => (
          <SlideView key={s.href} slide={s} active={i === index} position={`${i + 1} of ${slides.length}`} />
        ))}
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-2 px-4 pb-4 sm:gap-3 sm:pb-6">
        <ControlButton label="Previous slide" onClick={() => go(index - 1)}>
          <path d="M15 5l-7 7 7 7" />
        </ControlButton>

        <ol className="flex items-center gap-1.5 sm:gap-2">
          {slides.map((s, i) => (
            <li key={s.href}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${s.label}`}
                aria-current={i === index ? "true" : undefined}
                className={`relative block h-2.5 w-2.5 overflow-hidden rounded-full bg-ink/20 font-bold transition-colors sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 sm:text-sm ${
                  i === index ? "text-ink sm:bg-ink/10" : "text-muted hover:text-ink sm:bg-transparent sm:hover:bg-ink/5"
                }`}
              >
                <span className="hidden sm:inline">{s.label}</span>
                {i === index && (
                  <span
                    key={index}
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-full origin-left animate-progress bg-terracotta-dark/80 sm:h-0.5"
                    style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                    onAnimationEnd={() => go(index + 1)}
                  />
                )}
              </button>
            </li>
          ))}
        </ol>

        <ControlButton label="Next slide" onClick={() => go(index + 1)}>
          <path d="M9 5l7 7-7 7" />
        </ControlButton>
        <ControlButton label={userPaused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPausedChoice(!userPaused)}>
          {userPaused ? <path d="M8 5v14l11-7z" /> : <path d="M9 5v14M15 5v14" />}
        </ControlButton>
      </div>
    </section>
  );
}

function SlideView({ slide, active, position }: { slide: Slide; active: boolean; position: string }) {
  const media = slide.photo ?? slide.artwork?.image;
  const ratio = slide.photo
    ? slide.photo.width / slide.photo.height
    : slide.artwork
      ? slide.artwork.widthIn / slide.artwork.heightIn
      : 4 / 5;

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${position}: ${slide.label}`}
      aria-hidden={!active}
      inert={!active}
      className={`absolute inset-0 flex flex-col gap-4 px-4 pt-4 sm:px-8 lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-12 lg:px-16 lg:py-6 ${
        active ? "" : "invisible opacity-0"
      }`}
    >
      {/* Soft color wash behind the painting */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-24 -left-24 h-[70%] w-[60%] rounded-full blur-3xl ${slide.accent.bg} ${
          active ? "opacity-25 transition-opacity duration-1000" : "opacity-0"
        }`}
      />

      {/* The painting slides in, scaled to fit the space it has */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center lg:h-full" style={{ containerType: "size" }}>
        <div
          className={`relative ${active ? "animate-painting-in motion-reduce:animate-none" : ""}`}
          style={{ aspectRatio: `${ratio}`, width: `min(100cqw, 100cqh * ${ratio})` }}
        >
          {slide.artwork && !slide.photo ? (
            <ArtworkImage
              artwork={slide.artwork}
              fit="fill"
              priority={position.startsWith("1 ")}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="rounded-sm shadow-2xl"
            />
          ) : media ? (
            <div className="relative h-full w-full overflow-hidden rounded-[2rem] shadow-2xl">
              <Image src={media.src} alt={media.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          ) : (
            <div className="h-full w-full rounded-[2rem] bg-gradient-to-br from-marigold via-terracotta to-plum" />
          )}
        </div>
      </div>

      {/* Then, after a pause, the words and the link */}
      <div
        className={`relative text-center lg:text-left ${
          active ? "animate-rise-in [animation-delay:1.4s] motion-reduce:animate-none" : ""
        }`}
      >
        <p className={`text-xs font-bold uppercase tracking-[0.25em] sm:text-sm ${slide.accent.text}`}>{slide.label}</p>
        <h2 className="mt-1 font-display text-2xl leading-tight sm:text-4xl lg:mt-3 lg:text-6xl">{slide.title}</h2>
        <p className="mx-auto mt-2 line-clamp-3 max-w-xl text-sm text-muted sm:text-base lg:mx-0 lg:mt-5 lg:text-lg">
          {slide.text}
        </p>
        <Link href={slide.href} className={`${btn("primary")} mt-3 sm:px-8 sm:text-base lg:mt-8`}>
          {slide.cta} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-full border border-ink/15 bg-paper p-2 text-ink shadow-sm hover:border-ink/40"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}
