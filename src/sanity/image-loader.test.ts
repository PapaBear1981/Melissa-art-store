import { describe, expect, it } from "vitest";
import sanityImageLoader from "./image-loader";

describe("sanityImageLoader", () => {
  it("asks Sanity's CDN for a resized image", () => {
    expect(sanityImageLoader({ src: "https://cdn.sanity.io/images/p/d/abc.jpg", width: 640, quality: 60 })).toBe(
      "https://cdn.sanity.io/images/p/d/abc.jpg?w=640&q=60&auto=format&fit=max",
    );
  });

  it("uses quality 80 by default and replaces existing size params", () => {
    expect(sanityImageLoader({ src: "https://cdn.sanity.io/a.jpg?w=10&rect=0,0,5,5", width: 1200 })).toBe(
      "https://cdn.sanity.io/a.jpg?w=1200&rect=0%2C0%2C5%2C5&q=80&auto=format&fit=max",
    );
  });

  it("leaves other images untouched", () => {
    expect(sanityImageLoader({ src: "/placeholder.svg", width: 640 })).toBe("/placeholder.svg");
    expect(sanityImageLoader({ src: "https://example.com/a.jpg", width: 640 })).toBe("https://example.com/a.jpg");
  });
});
