/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleArtworks } from "@/lib/sample-data";
import { Lightbox } from "./Lightbox";

const landscape = sampleArtworks.find((a) => a.widthIn > a.heightIn)!;
const portrait = sampleArtworks.find((a) => a.widthIn < a.heightIn)!;

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

describe("Lightbox", () => {
  it("opens the painting full screen and closes with the Close button", async () => {
    render(<Lightbox artwork={landscape} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: `View ${landscape.title} full screen` }));
    const dialog = screen.getByRole("dialog", { name: `${landscape.title}, full screen` });
    expect(dialog).toHaveAttribute("open");

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(dialog).not.toHaveAttribute("open");
  });

  it("closes when the backdrop is clicked", async () => {
    render(<Lightbox artwork={portrait} />);
    await userEvent.click(screen.getByRole("button", { name: `View ${portrait.title} full screen` }));
    const dialog = screen.getByRole("dialog");
    await userEvent.click(dialog);
    expect(dialog).not.toHaveAttribute("open");
  });

  it("sizes wide paintings by width and tall ones by height", () => {
    const { unmount } = render(<Lightbox artwork={landscape} />);
    expect(document.querySelector("dialog > div > div")).toHaveClass("w-full");
    unmount();
    render(<Lightbox artwork={portrait} />);
    expect(document.querySelector("dialog > div > div")).toHaveClass("h-full", "max-h-full");
  });
});
