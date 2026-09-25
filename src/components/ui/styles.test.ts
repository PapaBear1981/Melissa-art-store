import { describe, expect, it } from "vitest";
import { btn, button } from "./styles";

describe("btn", () => {
  it("defaults to the primary variant", () => {
    expect(btn()).toBe(`${button.base} ${button.primary}`);
  });

  it("combines the base classes with the chosen variant", () => {
    expect(btn("secondary")).toBe(`${button.base} ${button.secondary}`);
    expect(btn("outline")).toBe(`${button.base} ${button.outline}`);
  });
});
