import type { Artwork } from "@/lib/types";

export type CartThumb = Pick<
  Artwork,
  "title" | "widthIn" | "heightIn" | "image" | "placeholder"
>;

export interface CartItem {
  /** Unique per line: slug + "original" or print option id. */
  key: string;
  slug: string;
  kind: "original" | "print";
  printOptionId?: string;
  title: string;
  detail: string;
  /** Display price in cents. Re-checked on the server at checkout. */
  unitPrice: number;
  quantity: number;
  thumb: CartThumb;
}

const STORAGE_KEY = "melissas-art-cart-v1";
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;

function read(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedItems;
  }
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    cachedItems = raw ? (JSON.parse(raw) as CartItem[]) : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

function write(items: CartItem[]) {
  cachedItems = items;
  const raw = JSON.stringify(items);
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
    // Only once saved: otherwise read() would see the old stored value and
    // replace the in-memory cart with it.
    cachedRaw = raw;
  } catch {
    // Storage unavailable (private mode) — cart still works for this visit.
  }
  listeners.forEach((l) => l());
}

export const cartStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: read,
  getServerSnapshot: () => EMPTY,

  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    const items = read();
    const existing = items.find((i) => i.key === item.key);
    if (existing) {
      // Originals are one of a kind.
      if (item.kind === "original") return;
      write(
        items.map((i) =>
          i.key === item.key ? { ...i, quantity: i.quantity + quantity } : i,
        ),
      );
    } else {
      write([...items, { ...item, quantity: item.kind === "original" ? 1 : quantity }]);
    }
  },
  setQuantity(key: string, quantity: number) {
    const items = read();
    if (quantity <= 0) {
      write(items.filter((i) => i.key !== key));
      return;
    }
    write(
      items.map((i) =>
        i.key === key && i.kind === "print" ? { ...i, quantity } : i,
      ),
    );
  },
  remove(key: string) {
    write(read().filter((i) => i.key !== key));
  },
  clear() {
    write(EMPTY);
  },
};

export function toThumb(a: CartThumb): CartThumb {
  return {
    title: a.title,
    widthIn: a.widthIn,
    heightIn: a.heightIn,
    image: a.image,
    placeholder: a.placeholder,
  };
}
