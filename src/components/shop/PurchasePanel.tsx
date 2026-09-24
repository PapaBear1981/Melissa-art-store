"use client";

import Link from "next/link";
import { useState } from "react";
import type { Artwork } from "@/lib/types";
import { formatDimensions, formatDimensionsCm, formatPrice } from "@/lib/format";
import { printFulfillment, printMaterials, type PrintMaterial, type PrintOption } from "@/lib/prints";
import type { ShippingQuote } from "@/lib/pricing";
import { useCart } from "@/lib/cart/CartProvider";
import { toThumb } from "@/lib/cart/store";
import { btn } from "@/components/ui/styles";
import { InquiryForm } from "@/components/forms/InquiryForm";

type Props = {
  artwork: Artwork;
  printOptions: PrintOption[];
  shipping: ShippingQuote;
};

export function PurchasePanel({ artwork, printOptions, shipping }: Props) {
  const originalAvailable = artwork.original.status === "available";
  const hasPrints = printOptions.length > 0;
  const [tab, setTab] = useState<"original" | "prints">(originalAvailable || !hasPrints ? "original" : "prints");

  return (
    <div className="rounded-2xl border border-line bg-paper p-6">
      {hasPrints && (
        <div role="tablist" aria-label="Purchase options" className="mb-6 grid grid-cols-2 rounded-full bg-blush p-1 text-sm font-semibold">
          {(["original", "prints"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              id={`tab-${t}`}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 transition-colors ${tab === t ? "bg-paper shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {t === "original" ? "Original painting" : "Prints"}
            </button>
          ))}
        </div>
      )}

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={hasPrints ? `tab-${tab}` : undefined}>
        {tab === "original" ? (
          <OriginalOption artwork={artwork} shipping={shipping} hasPrints={hasPrints} onShowPrints={() => setTab("prints")} />
        ) : (
          <PrintOptions artwork={artwork} options={printOptions} />
        )}
      </div>
    </div>
  );
}

function OriginalOption({
  artwork,
  shipping,
  hasPrints,
  onShowPrints,
}: {
  artwork: Artwork;
  shipping: ShippingQuote;
  hasPrints: boolean;
  onShowPrints: () => void;
}) {
  const { items, add, open } = useCart();
  const [inquiring, setInquiring] = useState(false);
  const { status, saleMode, price } = artwork.original;
  const inCart = items.some((i) => i.key === `${artwork.slug}:original`);
  const size = `${formatDimensions(artwork.widthIn, artwork.heightIn)} (${formatDimensionsCm(artwork.widthIn, artwork.heightIn)})`;

  if (status !== "available") {
    return (
      <div className="space-y-4">
        <p className="font-display text-2xl text-plum">
          {status === "sold" ? "The original has found its home." : "The original is in Melissa's private collection."}
        </p>
        <p className="text-muted">
          {hasPrints
            ? "You can still bring it home as a fine art print or canvas."
            : "Love this style? Commission something made just for you."}
        </p>
        <div className="flex flex-wrap gap-3">
          {hasPrints && (
            <button type="button" onClick={onShowPrints} className={btn("primary")}>
              See print options
            </button>
          )}
          <Link href="/commissions" className={btn("outline")}>
            Commission a painting
          </Link>
        </div>
      </div>
    );
  }

  const shippingNote =
    shipping.kind === "quote" ? (
      <>Because of its size, shipping (crating or art freight) is quoted personally for your location.</>
    ) : (
      <>
        Ships from the studio, carefully packed. US {formatPrice(shipping.us)} · International {formatPrice(shipping.intl)}.
        International buyers are responsible for any import duties.
      </>
    );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">One-of-a-kind original · {size}</p>
        <p className="mt-1 font-display text-3xl">
          {saleMode === "inquire-private" || price === undefined ? "Price on request" : formatPrice(price)}
        </p>
      </div>

      {saleMode === "buy-now" && price !== undefined ? (
        <>
          <button
            type="button"
            className={`${btn("primary")} w-full`}
            disabled={inCart}
            onClick={() => {
              add({
                key: `${artwork.slug}:original`,
                slug: artwork.slug,
                kind: "original",
                title: artwork.title,
                detail: `Original painting · ${formatDimensions(artwork.widthIn, artwork.heightIn)}`,
                unitPrice: price,
                thumb: toThumb(artwork),
              });
              open();
            }}
          >
            {inCart ? "In your cart" : "Add original to cart"}
          </button>
          <button type="button" onClick={() => setInquiring((v) => !v)} className="w-full text-sm font-semibold text-teal underline-offset-4 hover:underline" aria-expanded={inquiring}>
            Have a question about this piece?
          </button>
        </>
      ) : (
        !inquiring && (
          <button type="button" className={`${btn("primary")} w-full`} onClick={() => setInquiring(true)}>
            Inquire about this piece
          </button>
        )
      )}

      {inquiring && (
        <div className="border-t border-line pt-5">
          <InquiryForm artworkTitle={artwork.title} />
        </div>
      )}

      <p className="text-sm text-muted">{shippingNote}</p>
    </div>
  );
}

function PrintOptions({ artwork, options }: { artwork: Artwork; options: PrintOption[] }) {
  const { add, open } = useCart();
  const [material, setMaterial] = useState<PrintMaterial>("paper");
  const forMaterial = options.filter((o) => o.material === material);
  const [sizeId, setSizeId] = useState<string | undefined>(forMaterial[0]?.id);
  const selected = forMaterial.find((o) => o.id === sizeId) ?? forMaterial[0];
  const [qty, setQty] = useState(1);

  const chooseMaterial = (m: PrintMaterial) => {
    const current = selected;
    setMaterial(m);
    // Keep the same size when switching material, if it exists.
    const match = options.find(
      (o) => o.material === m && o.widthIn === current?.widthIn && o.heightIn === current?.heightIn,
    );
    setSizeId(match?.id ?? options.find((o) => o.material === m)?.id);
  };

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Material</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(printMaterials) as PrintMaterial[]).map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-xl border p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-teal ${
                material === m ? "border-teal bg-teal/5" : "border-line hover:border-teal/50"
              }`}
            >
              <input type="radio" name="material" value={m} checked={material === m} onChange={() => chooseMaterial(m)} className="sr-only" />
              <span className="block font-semibold">{printMaterials[m].label}</span>
              <span className="mt-1 block text-xs text-muted">{printMaterials[m].description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Size</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {forMaterial.map((o) => (
            <label
              key={o.id}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm has-focus-visible:ring-2 has-focus-visible:ring-teal ${
                selected?.id === o.id ? "border-teal bg-teal text-white" : "border-line hover:border-teal/50"
              }`}
            >
              <input type="radio" name="size" value={o.id} checked={selected?.id === o.id} onChange={() => setSizeId(o.id)} className="sr-only" />
              <span className="block font-semibold">{formatDimensions(o.widthIn, o.heightIn)}</span>
              <span className={`block text-xs ${selected?.id === o.id ? "text-white/85" : "text-muted"}`}>{formatPrice(o.price)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {selected && (
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="print-qty">Quantity</label>
          <select id="print-qty" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="rounded-full border border-line bg-paper px-4 py-3 font-semibold">
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button
            type="button"
            className={`${btn("primary")} flex-1`}
            onClick={() => {
              add(
                {
                  key: `${artwork.slug}:${selected.id}`,
                  slug: artwork.slug,
                  kind: "print",
                  printOptionId: selected.id,
                  title: artwork.title,
                  detail: `${printMaterials[selected.material].label} · ${formatDimensions(selected.widthIn, selected.heightIn)}`,
                  unitPrice: selected.price,
                  thumb: toThumb(artwork),
                },
                qty,
              );
              open();
            }}
          >
            Add to cart · {formatPrice(selected.price * qty)}
          </button>
        </div>
      )}

      <ul className="space-y-1 text-sm text-muted">
        <li>Every print is made from a professional scan of the original and hand-signed by Melissa.</li>
        <li>Printed locally and shipped from the studio in about {printFulfillment.turnaround}.</li>
        <li>Shipping to the US and worldwide is calculated at checkout.</li>
      </ul>
    </div>
  );
}
