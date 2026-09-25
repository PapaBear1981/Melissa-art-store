import { describe, expect, it, vi } from "vitest";
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

/* eslint-disable @typescript-eslint/no-explicit-any -- schema field shapes vary widely */
/** A fake Sanity validation rule whose methods record their calls and chain. */
function fakeRule() {
  const rule: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["required", "max", "warning", "custom"]) rule[m] = vi.fn(() => rule);
  return rule;
}

const field = (name: string): any => aboutPage.fields.find((f) => f.name === name);
const buttonField = (name: string): any => field("buttons").of[0].fields.find((f: any) => f.name === name);
/* eslint-enable @typescript-eslint/no-explicit-any */

describe("aboutPage validation", () => {
  it("allows at most two buttons", () => {
    const rule = fakeRule();
    field("buttons").validation(rule);
    expect(rule.max).toHaveBeenCalledWith(2);
  });

  it("requires button text", () => {
    const rule = fakeRule();
    buttonField("label").validation(rule);
    expect(rule.required).toHaveBeenCalled();
  });

  it("requires a button link and checks it", () => {
    const rule = fakeRule();
    buttonField("link").validation(rule);
    expect(rule.required).toHaveBeenCalled();
    expect(rule.custom).toHaveBeenCalledWith(checkLink);
  });

  it("warns when the search description is too long", () => {
    const rule = fakeRule();
    field("seoDescription").validation(rule);
    expect(rule.max).toHaveBeenCalledWith(200);
    expect(rule.warning).toHaveBeenCalledWith("Search engines cut this off after about 160 characters.");
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
