/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { SiteChrome } from "./SiteChrome";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("@/lib/checkout/actions", () => ({ startCheckout: vi.fn() }));
// The real Footer is an async Server Component that loads site content.
vi.mock("./Footer", () => ({ Footer: () => <footer>Site footer</footer> }));

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

describe("SiteChrome", () => {
  it("wraps the page in the header, footer and cart", async () => {
    vi.mocked(usePathname).mockReturnValue("/gallery");
    render(<SiteChrome><p>Page content</p></SiteChrome>);

    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
    expect(screen.getByRole("main")).toHaveTextContent("Page content");
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent("Site footer");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Open cart/ }));
    expect(screen.getByRole("dialog", { name: "Shopping cart" })).toBeInTheDocument();
  });

  it("leaves out the footer on the home page", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<SiteChrome><p>Home</p></SiteChrome>);
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });
});
