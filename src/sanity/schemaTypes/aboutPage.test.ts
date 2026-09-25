import { describe, expect, it } from "vitest";
import { aboutPage } from "./aboutPage";

describe("aboutPage schema", () => {
  it("previews as About page", () => {
    expect(aboutPage.preview!.prepare!()).toEqual({ title: "About page" });
  });

  it("has the fields the About page reads", () => {
    expect(aboutPage.fields.map((f) => f.name)).toEqual(["portrait", "intro", "statement", "studio", "milestones"]);
  });
});
