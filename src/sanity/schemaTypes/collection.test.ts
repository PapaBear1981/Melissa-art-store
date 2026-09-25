import { describe, expect, it, vi } from "vitest";
import { collection } from "./collection";

function chainRule() {
  const rule: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["required", "max"]) rule[m] = vi.fn(() => rule);
  return rule;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- schema field shapes vary widely
const field = (name: string): any => collection.fields.find((f) => f.name === name);

describe("collection schema", () => {
  it("requires a title and web address", () => {
    for (const name of ["title", "slug"]) {
      const rule = chainRule();
      field(name).validation(rule);
      expect(rule.required, name).toHaveBeenCalled();
    }
  });

  it("requires a short summary of at most 120 characters", () => {
    const rule = chainRule();
    field("summary").validation(rule);
    expect(rule.required).toHaveBeenCalled();
    expect(rule.max).toHaveBeenCalledWith(120);
  });

  it("sorts new collections after the defaults", () => {
    expect(field("order").initialValue).toBe(10);
  });
});
