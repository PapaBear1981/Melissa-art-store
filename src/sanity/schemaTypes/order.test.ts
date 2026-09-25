import { describe, expect, it } from "vitest";
import { order } from "./order";

describe("order schema", () => {
  const prepare = order.preview!.prepare! as unknown as (value: Record<string, unknown>) => Record<string, unknown>;

  it("starts new orders as new, with fulfilledAt hidden from the dashboard", () => {
    expect(order.fields.find((f) => f.name === "status")).toMatchObject({ initialValue: "new" });
    expect(order.fields.find((f) => f.name === "fulfilledAt")).toMatchObject({ hidden: true, readOnly: true });
  });

  it("previews the customer, total, date and status", () => {
    const placedAt = "2026-04-05T12:00:00Z";
    expect(prepare({ name: "Ann", total: 1850, status: "shipped", placedAt })).toEqual({
      title: "Ann: $1850",
      subtitle: `${new Date(placedAt).toLocaleDateString()} · shipped`,
    });
  });

  it("flags problem and test orders in the title", () => {
    expect(prepare({ name: "Ann", total: 10, test: true, problem: "Already sold" }).title).toBe("⚠️ [TEST] Ann: $10");
    expect(prepare({ name: "Ann", total: 10, test: true }).title).toBe("[TEST] Ann: $10");
  });

  it("fills in defaults for a bare order", () => {
    expect(prepare({})).toEqual({ title: "Customer: $0", subtitle: " · new" });
  });

  it("previews line items with their quantity", () => {
    const items = order.fields.find((f) => f.name === "items") as unknown as {
      of: { preview: { prepare: (v: { title: string; subtitle: number }) => unknown } }[];
    };
    expect(items.of[0].preview.prepare({ title: "Sunset print", subtitle: 2 })).toEqual({ title: "Sunset print", subtitle: "Qty 2" });
  });
});
