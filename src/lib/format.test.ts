import { describe, expect, it } from "vitest";
import { formatDimensions, formatDimensionsCm, formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats cents as whole US dollars", () => {
    expect(formatPrice(185000)).toBe("$1,850");
    expect(formatPrice(0)).toBe("$0");
  });
});

describe("formatDimensions", () => {
  it("uses inches below 4 feet", () => {
    expect(formatDimensions(24, 36)).toBe("24″ × 36″");
  });

  it("uses feet for whole feet from 4 feet up", () => {
    expect(formatDimensions(60, 60)).toBe("5′ × 5′");
  });

  it("keeps inches for large sizes that aren't whole feet", () => {
    expect(formatDimensions(50, 48)).toBe("50″ × 4′");
  });
});

describe("formatDimensionsCm", () => {
  it("converts to rounded centimetres", () => {
    expect(formatDimensionsCm(24, 36)).toBe("61 × 91 cm");
  });
});
