import type { Artwork } from "./types";

/**
 * Print catalog. Prints are made to order by our print-on-demand partner
 * (Prodigi), which prints in the US, UK, EU and Australia and ships
 * worldwide. Retail prices are set here; production cost is charged by the
 * partner per order. All prices in cents (USD).
 */
export const printPartner = {
  name: "Prodigi",
  productionDays: "3–5 business days",
} as const;

export type PrintMaterial = "paper" | "canvas";

export const printMaterials: Record<
  PrintMaterial,
  { label: string; description: string }
> = {
  paper: {
    label: "Fine art print",
    description:
      "Giclée print on archival, museum-grade matte paper with a small white border for framing.",
  },
  canvas: {
    label: "Stretched canvas",
    description:
      "Printed on gallery-quality canvas and stretched over a 1.5″ wooden frame. Ready to hang.",
  },
};

/** Standard print sizes (short side × long side) grouped by aspect ratio. */
const sizesByRatio: { ratio: number; sizes: [number, number][] }[] = [
  { ratio: 1, sizes: [[8, 8], [12, 12], [20, 20], [30, 30]] },
  { ratio: 1.25, sizes: [[8, 10], [16, 20], [24, 30]] },
  { ratio: 4 / 3, sizes: [[9, 12], [12, 16], [18, 24], [30, 40]] },
  { ratio: 1.5, sizes: [[8, 12], [12, 18], [20, 30], [24, 36]] },
];

/** Retail price tiers by the print's longest side. */
const priceTiers: { maxLongSide: number; paper: number; canvas: number }[] = [
  { maxLongSide: 12, paper: 4500, canvas: 8500 },
  { maxLongSide: 16, paper: 6500, canvas: 12500 },
  { maxLongSide: 20, paper: 8500, canvas: 16500 },
  { maxLongSide: 30, paper: 12500, canvas: 22500 },
  { maxLongSide: 40, paper: 17500, canvas: 32000 },
];

export interface PrintOption {
  id: string;
  material: PrintMaterial;
  widthIn: number;
  heightIn: number;
  price: number;
}

function priceFor(material: PrintMaterial, longSide: number): number {
  const tier =
    priceTiers.find((t) => longSide <= t.maxLongSide) ??
    priceTiers[priceTiers.length - 1];
  return tier[material];
}

/** Every print option available for an artwork, matched to its proportions. */
export function getPrintOptions(artwork: Artwork): PrintOption[] {
  if (!artwork.printsEnabled) return [];
  const portrait = artwork.heightIn >= artwork.widthIn;
  const ratio =
    Math.max(artwork.widthIn, artwork.heightIn) /
    Math.min(artwork.widthIn, artwork.heightIn);
  const group = sizesByRatio.reduce((best, g) =>
    Math.abs(g.ratio - ratio) < Math.abs(best.ratio - ratio) ? g : best,
  );

  const materials: PrintMaterial[] = ["paper", "canvas"];
  return materials.flatMap((material) =>
    group.sizes.map(([short, long]) => {
      const widthIn = portrait ? short : long;
      const heightIn = portrait ? long : short;
      return {
        id: `${material}-${widthIn}x${heightIn}`,
        material,
        widthIn,
        heightIn,
        price: priceFor(material, long),
      };
    }),
  );
}

export function getPrintOption(artwork: Artwork, optionId: string) {
  return getPrintOptions(artwork).find((o) => o.id === optionId);
}

export function lowestPrintPrice(artwork: Artwork): number | undefined {
  const prices = getPrintOptions(artwork).map((o) => o.price);
  return prices.length ? Math.min(...prices) : undefined;
}
