import { describe, expect, it } from "vitest";
import { commissionRequest } from "./commissionRequest";

describe("commissionRequest schema", () => {
  const prepare = commissionRequest.preview!.prepare! as unknown as (value: Record<string, unknown>) => Record<string, unknown>;

  it("starts new requests as new", () => {
    expect(commissionRequest.fields.find((f) => f.name === "status")).toMatchObject({ initialValue: "new" });
  });

  it("previews the status and requested size", () => {
    const media = { asset: "photo" };
    expect(prepare({ title: "Ann", size: "24x36", status: "quoted", media })).toEqual({
      title: "Ann",
      subtitle: "quoted · 24x36",
      media,
    });
  });

  it("treats a missing status as new and a missing size as blank", () => {
    expect(prepare({ title: "Ann" })).toEqual({ title: "Ann", subtitle: "new · ", media: undefined });
  });
});
