/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionHeading } from "./SectionHeading";

describe("SectionHeading", () => {
  it("shows a heading with a link when given one", () => {
    const { container } = render(
      <SectionHeading title="New work" href="/gallery" linkLabel="See all" color="text-teal" />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "New work" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all →" })).toHaveAttribute("href", "/gallery");
    expect(container.querySelector("svg")).toHaveClass("text-teal");
  });

  it("has no link without an href and uses the default color", () => {
    const { container } = render(<SectionHeading title="New work" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveClass("text-marigold");
  });
});
