/** @vitest-environment jsdom */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { site } from "@/config/site";
import { sampleArtworks } from "@/lib/sample-data";
import { PageSlideshow, type Slide } from "./PageSlideshow";

const artwork = sampleArtworks[0];
const photo = { src: "/studio.jpg", width: 1200, height: 900, alt: "Melissa painting in her studio" };
const accent = { text: "text-teal", bg: "bg-teal" };

const slides: Slide[] = [
  { href: "/gallery", label: "Gallery", title: "See the work", text: "Every painting.", cta: "View the gallery", accent, artwork },
  { href: "/about", label: "About", title: "Meet Melissa", text: "The artist.", cta: "Read her story", accent, photo },
  { href: "/commissions", label: "Commissions", title: "Made for you", text: "Custom work.", cta: "Start a commission", accent },
];

// jsdom has no matchMedia; fake the reduced-motion query.
let reduceMotion = false;
const mqListeners = new Set<() => void>();
beforeEach(() => {
  reduceMotion = false;
  mqListeners.clear();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      media: query,
      get matches() {
        return reduceMotion;
      },
      addEventListener: (_: string, l: () => void) => mqListeners.add(l),
      removeEventListener: (_: string, l: () => void) => mqListeners.delete(l),
    })),
  );
});

const renderShow = (s: Slide[] = slides) => render(<PageSlideshow slides={s} />);
const carousel = () => screen.getByRole("region", { name: "Explore the site" });
const dot = (label: string) => screen.getByRole("button", { name: `Show ${label}` });
const currentLabel = () =>
  screen.getByRole("button", { current: true }).getAttribute("aria-label");
const progress = () =>
  screen.getByRole("button", { current: true }).querySelector("span[aria-hidden]") as HTMLElement;
// Hidden slides have no accessible name, so find them by their label.
// jsdom lacks AnimationEvent, so React listens for the WebKit-prefixed name.
const endAnimation = (el: HTMLElement) =>
  fireEvent(el, new Event("webkitAnimationEnd", { bubbles: true }));
// Activate a control from the keyboard, so the mouse doesn't hover the carousel.
const press = async (name: string) => {
  screen.getByRole("button", { name }).focus();
  await userEvent.keyboard("{Enter}");
};
const slide = (name: string) => {
  const el = document.querySelector<HTMLElement>(`[aria-roledescription="slide"][aria-label="${name}"]`);
  if (!el) throw new Error(`No slide "${name}"`);
  return el;
};

describe("PageSlideshow", () => {
  it("labels the carousel and shows the first slide only", () => {
    renderShow();
    expect(carousel()).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(`${site.name}: ${site.tagline}`);

    const first = slide("1 of 3: Gallery");
    expect(first).toHaveAttribute("aria-roledescription", "slide");
    expect(first).toHaveAttribute("aria-hidden", "false");
    expect(first).not.toHaveAttribute("inert");
    expect(within(first).getByRole("heading", { level: 2, name: "See the work" })).toBeInTheDocument();
    expect(within(first).getByRole("link", { name: "View the gallery" })).toHaveAttribute("href", "/gallery");

    for (const name of ["2 of 3: About", "3 of 3: Commissions"]) {
      expect(slide(name)).toHaveAttribute("aria-hidden", "true");
      expect(slide(name)).toHaveAttribute("inert");
    }
    expect(currentLabel()).toBe("Show Gallery");
  });

  it("shows an artwork, a photo, or a color wash", () => {
    renderShow();
    expect(
      within(slide("1 of 3: Gallery")).getByRole("img", { name: `${artwork.title} (placeholder image)`, hidden: true }),
    ).toBeInTheDocument();
    expect(within(slide("2 of 3: About")).getByRole("img", { name: photo.alt, hidden: true })).toBeInTheDocument();
    expect(within(slide("3 of 3: Commissions")).queryByRole("img", { hidden: true })).not.toBeInTheDocument();
  });

  it("uses the artwork's scan when it has one, and prefers a photo over an artwork", () => {
    const scanned = { ...artwork, image: { src: "/scan.jpg", width: 1500, height: 1000, alt: "Scan of hills" } };
    renderShow([
      { ...slides[0], artwork: scanned },
      { ...slides[1], artwork: scanned },
    ]);
    const first = slide("1 of 2: Gallery");
    expect(within(first).getByRole("img", { name: "Scan of hills", hidden: true })).toBeInTheDocument();
    const second = slide("2 of 2: About");
    expect(within(second).getByRole("img", { name: photo.alt, hidden: true })).toBeInTheDocument();
    expect(within(second).queryByRole("img", { name: "Scan of hills", hidden: true })).not.toBeInTheDocument();
  });

  it("sizes each slide's media to its proportions", () => {
    renderShow();
    const ratio = (name: string) =>
      parseFloat((slide(name).querySelector("[style*='aspect-ratio']") as HTMLElement).style.aspectRatio);
    expect(ratio("1 of 3: Gallery")).toBeCloseTo(artwork.widthIn / artwork.heightIn);
    expect(ratio("2 of 3: About")).toBeCloseTo(photo.width / photo.height);
    expect(ratio("3 of 3: Commissions")).toBeCloseTo(4 / 5);
  });

  it("moves with the next and previous buttons, wrapping around", async () => {
    renderShow();
    await userEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(currentLabel()).toBe("Show Commissions");
    expect(slide("3 of 3: Commissions")).toHaveAttribute("aria-hidden", "false");

    await userEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(currentLabel()).toBe("Show Gallery");
    await userEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(currentLabel()).toBe("Show About");
  });

  it("jumps to a slide from its dot", async () => {
    renderShow();
    await userEvent.click(dot("Commissions"));
    expect(dot("Commissions")).toHaveAttribute("aria-current", "true");
    expect(dot("Gallery")).not.toHaveAttribute("aria-current");
  });

  it("moves with the arrow keys and ignores other keys", async () => {
    renderShow();
    dot("Gallery").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(currentLabel()).toBe("Show Commissions");
    await userEvent.keyboard("{ArrowRight}");
    expect(currentLabel()).toBe("Show Gallery");
    await userEvent.keyboard("{ArrowRight}");
    expect(currentLabel()).toBe("Show About");
    fireEvent.keyDown(carousel(), { key: "Enter" });
    expect(currentLabel()).toBe("Show About");
  });

  it("advances when the progress bar finishes, wrapping to the start", () => {
    renderShow();
    expect(progress().style.animationDuration).toBe("7000ms");
    endAnimation(progress());
    expect(currentLabel()).toBe("Show About");
    endAnimation(progress());
    endAnimation(progress());
    expect(currentLabel()).toBe("Show Gallery");
  });

  it("plays by default and can be paused and resumed", async () => {
    renderShow();
    const live = slide("1 of 3: Gallery").parentElement!;
    expect(progress().style.animationPlayState).toBe("running");
    expect(live).toHaveAttribute("aria-live", "off");

    await press("Pause slideshow");
    expect(progress().style.animationPlayState).toBe("paused");
    expect(live).toHaveAttribute("aria-live", "polite");

    await press("Play slideshow");
    expect(progress().style.animationPlayState).toBe("running");
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toBeInTheDocument();
  });

  it("starts paused when the visitor prefers reduced motion, but can still play", async () => {
    reduceMotion = true;
    renderShow();
    expect(progress().style.animationPlayState).toBe("paused");
    await press("Play slideshow");
    expect(progress().style.animationPlayState).toBe("running");
  });

  it("renders on the server as playing, then pauses after hydrating for reduced motion", async () => {
    reduceMotion = true;
    const ui = <PageSlideshow slides={slides} />;
    const html = renderToString(ui);
    expect(html).toContain('aria-label="Pause slideshow"');

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    await act(async () => {
      render(ui, { container, hydrate: true });
    });
    expect(screen.getByRole("button", { name: "Play slideshow" })).toBeInTheDocument();
  });

  it("follows a change to the reduced-motion setting until the visitor chooses", async () => {
    renderShow();
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toBeInTheDocument();
    reduceMotion = true;
    act(() => mqListeners.forEach((l) => l()));
    expect(screen.getByRole("button", { name: "Play slideshow" })).toBeInTheDocument();
  });

  it("stops listening for the setting once removed", () => {
    const { unmount } = renderShow();
    expect(mqListeners.size).toBeGreaterThan(0);
    unmount();
    expect(mqListeners.size).toBe(0);
  });

  it("pauses while a mouse hovers, but not for touch", async () => {
    renderShow();
    await userEvent.hover(carousel());
    expect(progress().style.animationPlayState).toBe("paused");
    // Hovering is not the same as choosing to pause.
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toBeInTheDocument();
    await userEvent.unhover(carousel());
    expect(progress().style.animationPlayState).toBe("running");

    fireEvent.pointerEnter(carousel(), { pointerType: "touch" });
    expect(progress().style.animationPlayState).toBe("running");
  });
});
