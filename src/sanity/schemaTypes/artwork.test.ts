import { afterEach, describe, expect, it, vi } from "vitest";
import { artwork } from "./artwork";

type CustomFn = (value: unknown, ctx: { document?: unknown }) => unknown;

/**
 * A fake Sanity validation rule: every method records its call and returns
 * the rule, so chains like `r.required().min(1)` work. `custom()` captures
 * the function it's given.
 */
function fakeRule() {
  const captured: { custom?: CustomFn } = {};
  const methods = ["required", "warning", "integer", "min", "max", "positive", "email"] as const;
  const rule = {} as Record<(typeof methods)[number] | "custom", ReturnType<typeof vi.fn>>;
  for (const m of methods) rule[m] = vi.fn(() => rule);
  rule.custom = vi.fn((fn: CustomFn) => {
    captured.custom = fn;
    return rule;
  });
  return { rule, captured };
}

/* eslint-disable @typescript-eslint/no-explicit-any -- schema field shapes vary widely */
/** Looks up a field on a schema type by name. */
function field(type: { fields?: unknown[] }, name: string): any {
  const found = (type.fields as { name: string }[] | undefined)?.find((f) => f.name === name);
  return found;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Runs a field's `custom()` validation against a value and document. */
function runCustom(f: { validation: (r: unknown) => unknown }, value: unknown, document: unknown) {
  const { rule, captured } = fakeRule();
  f.validation(rule);
  return captured.custom!(value, { document });
}

describe("artwork schema", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("requires the basic details", () => {
    for (const name of ["title", "slug", "medium", "status"]) {
      const { rule } = fakeRule();
      field(artwork, name).validation(rule);
      expect(rule.required, name).toHaveBeenCalled();
    }
  });

  it("only warns when the photo is missing", () => {
    const { rule } = fakeRule();
    field(artwork, "image").validation(rule);
    expect(rule.required).toHaveBeenCalled();
    expect(rule.warning).toHaveBeenCalledWith("Add a photo. A colorful placeholder is shown until you do.");
  });

  it("limits the year to a whole number between 1950 and 2100, defaulting to this year", () => {
    vi.useFakeTimers({ now: new Date("2031-06-01T00:00:00Z"), toFake: ["Date"] });
    const year = field(artwork, "year");
    expect(year.initialValue()).toBe(2031);
    const { rule } = fakeRule();
    year.validation(rule);
    expect(rule.integer).toHaveBeenCalled();
    expect(rule.min).toHaveBeenCalledWith(1950);
    expect(rule.max).toHaveBeenCalledWith(2100);
  });

  it("requires positive sizes up to 240 inches", () => {
    for (const name of ["widthIn", "heightIn"]) {
      const { rule } = fakeRule();
      field(artwork, name).validation(rule);
      expect(rule.positive).toHaveBeenCalled();
      expect(rule.max).toHaveBeenCalledWith(240);
    }
  });

  it("doesn't allow negative custom shipping prices", () => {
    const shipping = field(artwork, "shipping");
    for (const sub of shipping.fields) {
      const { rule } = fakeRule();
      sub.validation(rule);
      expect(rule.min).toHaveBeenCalledWith(0);
    }
    expect(shipping.fields.map((f: { name: string }) => f.name)).toEqual(["us", "intl"]);
  });

  describe("sale mode", () => {
    const saleMode = field(artwork, "saleMode");
    const warning = {
      message: "Paintings over 48″ need a shipping quote. Consider “Inquire”, or set custom shipping prices below.",
      level: "warning",
    };

    it("is only shown for available paintings", () => {
      expect(saleMode.hidden({ document: { status: "available" } })).toBe(false);
      expect(saleMode.hidden({ document: { status: "sold" } })).toBe(true);
      expect(saleMode.hidden({ document: undefined })).toBe(true);
    });

    it("warns when an available buy-now painting is over 48 inches", () => {
      expect(runCustom(saleMode, "buy-now", { status: "available", widthIn: 49, heightIn: 30 })).toEqual(warning);
      expect(runCustom(saleMode, "buy-now", { status: "available", widthIn: 20, heightIn: 60 })).toEqual(warning);
    });

    it("allows buy-now up to exactly 48 inches", () => {
      expect(runCustom(saleMode, "buy-now", { status: "available", widthIn: 48, heightIn: 48 })).toBe(true);
    });

    it("doesn't warn for inquiries, sold paintings, or missing sizes", () => {
      expect(runCustom(saleMode, "inquire", { status: "available", widthIn: 60, heightIn: 60 })).toBe(true);
      expect(runCustom(saleMode, "buy-now", { status: "sold", widthIn: 60, heightIn: 60 })).toBe(true);
      expect(runCustom(saleMode, "buy-now", { status: "available" })).toBe(true);
      expect(runCustom(saleMode, "buy-now", undefined)).toBe(true);
    });
  });

  describe("price", () => {
    const price = field(artwork, "price");
    const missing = "Add a price, or choose “Inquire, price hidden”.";

    it("is shown for available and sold paintings only", () => {
      expect(price.hidden({ document: { status: "available" } })).toBe(false);
      expect(price.hidden({ document: { status: "sold" } })).toBe(false);
      expect(price.hidden({ document: { status: "not-for-sale" } })).toBe(true);
      expect(price.hidden({ document: undefined })).toBe(true);
    });

    it("must be at least $1", () => {
      const { rule } = fakeRule();
      price.validation(rule);
      expect(rule.min).toHaveBeenCalledWith(1);
    });

    it("is required for available paintings unless the price is hidden", () => {
      expect(runCustom(price, undefined, { status: "available", saleMode: "buy-now" })).toBe(missing);
      expect(runCustom(price, 0, { status: "available", saleMode: "inquire" })).toBe(missing);
      expect(runCustom(price, undefined, { status: "available" })).toBe(missing);
      expect(runCustom(price, 1850, { status: "available", saleMode: "buy-now" })).toBe(true);
      expect(runCustom(price, undefined, { status: "available", saleMode: "inquire-private" })).toBe(true);
    });

    it("isn't required once a painting is sold or not for sale", () => {
      expect(runCustom(price, undefined, { status: "sold", saleMode: "buy-now" })).toBe(true);
      expect(runCustom(price, undefined, { status: "not-for-sale" })).toBe(true);
      expect(runCustom(price, undefined, undefined)).toBe(true);
    });
  });

  it("shows custom shipping only for available paintings", () => {
    const shipping = field(artwork, "shipping");
    expect(shipping.hidden({ document: { status: "available" } })).toBe(false);
    expect(shipping.hidden({ document: { status: "sold" } })).toBe(true);
    expect(shipping.hidden({})).toBe(true);
  });

  it("defaults new paintings to available, buy now, not featured and no prints", () => {
    expect(field(artwork, "status").initialValue).toBe("available");
    expect(field(artwork, "saleMode").initialValue).toBe("buy-now");
    expect(field(artwork, "featured").initialValue).toBe(false);
    expect(field(artwork, "printsEnabled").initialValue).toBe(false);
  });

  it("previews the year and a sold or private label", () => {
    const prepare = artwork.preview!.prepare! as unknown as (value: Record<string, unknown>) => Record<string, unknown>;
    const media = { asset: "img" };
    expect(prepare({ title: "Sunset", year: 2024, status: "available", media })).toEqual({ title: "Sunset", subtitle: "2024", media });
    expect(prepare({ title: "Sunset", year: 2024, status: "sold" })).toMatchObject({ subtitle: "2024 · Sold" });
    expect(prepare({ title: "Sunset", status: "not-for-sale" })).toMatchObject({ subtitle: " · Not for sale" });
  });
});
