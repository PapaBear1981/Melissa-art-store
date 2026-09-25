import { describe, expect, it } from "vitest";
import { schemaTypes, singletonTypes, websiteCreatedTypes } from "./index";

describe("schema index", () => {
  it("registers every document type", () => {
    expect(schemaTypes.map((t) => t.name)).toEqual(["artwork", "collection", "order", "commissionRequest", "aboutPage", "siteSettings"]);
  });

  it("marks website-created and singleton types", () => {
    expect([...websiteCreatedTypes]).toEqual(["order", "commissionRequest"]);
    expect([...singletonTypes]).toEqual(["aboutPage", "siteSettings"]);
  });
});
