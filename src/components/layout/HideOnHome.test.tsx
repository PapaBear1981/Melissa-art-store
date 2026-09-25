/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { HideOnHome } from "./HideOnHome";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

describe("HideOnHome", () => {
  it("hides its children on the home page", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<HideOnHome><p>Footer</p></HideOnHome>);
    expect(screen.queryByText("Footer")).not.toBeInTheDocument();
  });

  it("shows its children everywhere else", () => {
    vi.mocked(usePathname).mockReturnValue("/shop");
    render(<HideOnHome><p>Footer</p></HideOnHome>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
