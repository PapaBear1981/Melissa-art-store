/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotFoundContent } from "./NotFoundContent";

describe("NotFoundContent", () => {
  it("explains the page is missing and links back into the site", () => {
    render(<NotFoundContent />);
    expect(screen.getByRole("heading", { level: 1, name: "This canvas is blank" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View the gallery" })).toHaveAttribute("href", "/gallery");
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });
});
