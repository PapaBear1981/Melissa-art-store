/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("shows the title, eyebrow and intro", () => {
    render(<PageHeader eyebrow="The shop" title="Originals & prints" intro={<p>Hand-signed.</p>} />);
    expect(screen.getByRole("heading", { level: 1, name: "Originals & prints" })).toBeInTheDocument();
    expect(screen.getByText("The shop")).toBeInTheDocument();
    expect(screen.getByText("Hand-signed.")).toBeInTheDocument();
  });

  it("renders just the title when nothing else is given", () => {
    const { container } = render(<PageHeader title="Gallery" />);
    const header = container.querySelector("header")!;
    expect(header.children).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Gallery" })).toBeInTheDocument();
  });
});
