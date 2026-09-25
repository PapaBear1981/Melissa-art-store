import { describe, expect, it, vi } from "vitest";
import { siteSettings } from "./siteSettings";

describe("siteSettings schema", () => {
  it("checks the public email address is an email", () => {
    const rule = { email: vi.fn(() => rule) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- schema field shapes vary widely
    (siteSettings.fields.find((f) => f.name === "email") as any).validation(rule);
    expect(rule.email).toHaveBeenCalled();
  });

  it("previews as Contact details", () => {
    expect(siteSettings.preview!.prepare!()).toEqual({ title: "Contact details" });
  });
});
