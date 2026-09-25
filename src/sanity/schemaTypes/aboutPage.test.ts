import { describe, expect, it } from "vitest";
import { aboutPage, checkLink } from "./aboutPage";

describe("aboutPage schema", () => {
  it("previews as About page", () => {
    expect(aboutPage.preview!.prepare!()).toEqual({ title: "About page" });
  });

  it("has the fields the About page reads", () => {
    expect(aboutPage.fields.map((f) => f.name)).toEqual([
      "heading",
      "portrait",
      "intro",
      "statementTitle",
      "statement",
      "studioTitle",
      "studio",
      "milestonesTitle",
      "milestones",
      "buttons",
      "seoDescription",
    ]);
  });
});

describe("checkLink", () => {
  it.each(["/gallery", "https://example.com", "http://example.com", "mailto:hi@example.com", undefined, ""])(
    "accepts %s",
    (link) => expect(checkLink(link)).toBe(true),
  );

  it.each(["gallery", "www.example.com", "javascript:alert(1)"])("rejects %s with a hint", (link) => {
    expect(checkLink(link)).toMatch(/Start with "\/"/);
  });
});
