/** @vitest-environment jsdom */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Brushline } from "./Brushline";

describe("Brushline", () => {
  it("is decorative and hidden from assistive tech", () => {
    const { container } = render(<Brushline />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveClass("h-3", "w-24");
  });

  it("adds extra classes", () => {
    const { container } = render(<Brushline className="text-marigold" />);
    expect(container.querySelector("svg")).toHaveClass("text-marigold");
  });
});
