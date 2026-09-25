import { describe, expect, it } from "vitest";
import { placeholderFor } from "./placeholder";

describe("placeholderFor", () => {
  it("maps the empty key to the first palette and style", () => {
    const p = placeholderFor("");
    expect(p.seed).toBe(0);
    expect(p.palette[0]).toBe("#f6c177");
    expect(p.style).toBe("abstract");
  });

  it("derives seed, palette and style from a string hash", () => {
    // hash("ab") = 97 * 31 + 98 = 3105 → palette 3105 % 6 = 3, style (3105 >>> 4) % 3 = 2
    expect(placeholderFor("ab")).toEqual({
      seed: 3105,
      palette: ["#fff3b0", "#e9c46a", "#f4a261", "#e76f51", "#6b2d5c"],
      style: "floral",
    });
  });

  it("is stable for the same key and varies between keys", () => {
    expect(placeholderFor("golden-hour-hills")).toEqual(placeholderFor("golden-hour-hills"));
    const styles = new Set(["a", "b", "c", "d", "e", "f", "ab", "xyz"].map((k) => placeholderFor(k).style));
    expect(styles.size).toBeGreaterThan(1);
  });

  it("keeps the seed within 0–9999 for long keys", () => {
    const p = placeholderFor("a-very-long-painting-slug-that-overflows-32-bits".repeat(5));
    expect(p.seed).toBeGreaterThanOrEqual(0);
    expect(p.seed).toBeLessThan(10000);
    expect(Number.isInteger(p.seed)).toBe(true);
  });
});
