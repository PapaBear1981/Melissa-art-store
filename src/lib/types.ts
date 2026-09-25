export type Palette = readonly string[];

/** Stand-in artwork image used until real scans are uploaded. */
export interface PlaceholderArt {
  seed: number;
  palette: Palette;
  style: "abstract" | "landscape" | "floral";
}

export interface ArtImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Tiny blurred preview shown while the full image loads. */
  lqip?: string;
}

/**
 * How the original painting is offered:
 * - buy-now:          price shown, add to cart
 * - inquire:          price shown ("Inquire"), buyer sends a message
 * - inquire-private:  price hidden ("Price on request")
 */
export type SaleMode = "buy-now" | "inquire" | "inquire-private";

export type OriginalStatus = "available" | "sold" | "not-for-sale";

export interface Artwork {
  slug: string;
  title: string;
  year: number;
  medium: string;
  widthIn: number;
  heightIn: number;
  description: string[];
  collections: string[];
  featured?: boolean;
  /** Draft pieces are hidden everywhere. */
  hidden?: boolean;
  /** Retired from the gallery and shop; still shown in the Archive under its year. */
  archived?: boolean;
  original: {
    status: OriginalStatus;
    saleMode: SaleMode;
    /** Price in cents (USD). */
    price?: number;
    /** Optional per-piece shipping override in cents. */
    shipping?: { us: number; intl: number };
  };
  /** Whether prints of this piece can be ordered. */
  printsEnabled: boolean;
  image?: ArtImage;
  placeholder: PlaceholderArt;
}

export interface Collection {
  slug: string;
  title: string;
  summary: string;
  description: string[];
  /** Slug of the artwork used as the cover image. */
  cover: string;
}
