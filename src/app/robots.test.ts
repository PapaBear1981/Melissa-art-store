import { describe, expect, it } from "vitest";
import { site } from "@/config/site";
import robots from "./robots";

describe("robots", () => {
  it("allows everything except the cart and the dashboard, and links the sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/cart", "/studio"] },
      sitemap: `${site.url}/sitemap.xml`,
    });
  });
});
