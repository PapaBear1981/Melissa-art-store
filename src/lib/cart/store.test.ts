/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CartItem } from "./store";

const KEY = "melissas-art-cart-v1";

// The store caches at module level, so every test gets a fresh copy.
let store: typeof import("./store");
beforeEach(async () => {
  vi.resetModules();
  store = await import("./store");
});

const thumb = {
  title: "Golden Hour Hills",
  widthIn: 36,
  heightIn: 24,
  placeholder: { seed: 1, palette: ["#000"], style: "abstract" as const },
};

const originalItem: Omit<CartItem, "quantity"> = {
  key: "golden-hour-hills:original",
  slug: "golden-hour-hills",
  kind: "original",
  title: "Golden Hour Hills",
  detail: "Original painting",
  unitPrice: 185000,
  thumb,
};

const printItem: Omit<CartItem, "quantity"> = {
  key: "golden-hour-hills:paper-12x8",
  slug: "golden-hour-hills",
  kind: "print",
  printOptionId: "paper-12x8",
  title: "Golden Hour Hills",
  detail: "Fine art print",
  unitPrice: 4500,
  thumb,
};

const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? "null") as CartItem[] | null;

describe("cartStore reading", () => {
  it("starts empty and returns the same empty array for the server", () => {
    expect(store.cartStore.getSnapshot()).toEqual([]);
    expect(store.cartStore.getServerSnapshot()).toBe(store.cartStore.getServerSnapshot());
  });

  it("loads a saved cart from localStorage", () => {
    window.localStorage.setItem(KEY, JSON.stringify([{ ...printItem, quantity: 2 }]));
    expect(store.cartStore.getSnapshot()).toEqual([{ ...printItem, quantity: 2 }]);
  });

  it("returns the same array while storage is unchanged, so React doesn't re-render", () => {
    window.localStorage.setItem(KEY, JSON.stringify([{ ...printItem, quantity: 2 }]));
    const first = store.cartStore.getSnapshot();
    expect(store.cartStore.getSnapshot()).toBe(first);
    window.localStorage.setItem(KEY, JSON.stringify([{ ...printItem, quantity: 3 }]));
    const second = store.cartStore.getSnapshot();
    expect(second).not.toBe(first);
    expect(second[0].quantity).toBe(3);
  });

  it("treats corrupt JSON as an empty cart", () => {
    window.localStorage.setItem(KEY, "{not json");
    expect(store.cartStore.getSnapshot()).toEqual([]);
  });

  it("keeps the last known cart when localStorage can't be read", () => {
    store.cartStore.add(printItem, 2);
    const before = store.cartStore.getSnapshot();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(store.cartStore.getSnapshot()).toBe(before);
  });

  it("is empty when localStorage can't be read from the start", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(store.cartStore.getSnapshot()).toEqual([]);
  });
});

describe("cartStore writing", () => {
  it("adds a print with the given quantity and saves it", () => {
    store.cartStore.add(printItem, 3);
    expect(store.cartStore.getSnapshot()).toEqual([{ ...printItem, quantity: 3 }]);
    expect(stored()).toEqual([{ ...printItem, quantity: 3 }]);
  });

  it("defaults to a quantity of one", () => {
    store.cartStore.add(printItem);
    expect(store.cartStore.getSnapshot()[0].quantity).toBe(1);
  });

  it("increases the quantity when the same print is added again", () => {
    store.cartStore.add(printItem, 2);
    store.cartStore.add({ ...printItem, key: "other", printOptionId: "paper-18x12" });
    store.cartStore.add(printItem, 3);
    expect(store.cartStore.getSnapshot().map((i) => [i.key, i.quantity])).toEqual([
      [printItem.key, 5],
      ["other", 1],
    ]);
  });

  it("keeps originals at quantity one however they are added", () => {
    store.cartStore.add(originalItem, 4);
    expect(store.cartStore.getSnapshot()).toEqual([{ ...originalItem, quantity: 1 }]);
    const snapshot = store.cartStore.getSnapshot();
    store.cartStore.add(originalItem, 2);
    expect(store.cartStore.getSnapshot()).toBe(snapshot);
  });

  it("changes print quantities but never an original's", () => {
    store.cartStore.add(originalItem);
    store.cartStore.add(printItem);
    store.cartStore.setQuantity(printItem.key, 7);
    store.cartStore.setQuantity(originalItem.key, 7);
    expect(store.cartStore.getSnapshot().map((i) => i.quantity)).toEqual([1, 7]);
  });

  it("removes a line when its quantity is set to zero or below", () => {
    store.cartStore.add(originalItem);
    store.cartStore.add(printItem);
    store.cartStore.setQuantity(printItem.key, 0);
    expect(store.cartStore.getSnapshot().map((i) => i.key)).toEqual([originalItem.key]);
    store.cartStore.setQuantity(originalItem.key, -1);
    expect(store.cartStore.getSnapshot()).toEqual([]);
  });

  it("removes a line and clears the cart", () => {
    store.cartStore.add(originalItem);
    store.cartStore.add(printItem);
    store.cartStore.remove(originalItem.key);
    expect(store.cartStore.getSnapshot().map((i) => i.key)).toEqual([printItem.key]);
    store.cartStore.clear();
    expect(store.cartStore.getSnapshot()).toEqual([]);
    expect(stored()).toEqual([]);
  });

  it("keeps working in memory when localStorage is entirely unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    store.cartStore.add(printItem, 2);
    store.cartStore.add(printItem, 1);
    expect(store.cartStore.getSnapshot()).toEqual([{ ...printItem, quantity: 3 }]);
  });

  it("keeps working in memory when localStorage can't be written", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    store.cartStore.add(printItem, 2);
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(store.cartStore.getSnapshot()).toEqual([{ ...printItem, quantity: 2 }]);
  });
});

describe("cartStore subscriptions", () => {
  it("notifies subscribers on every change until they unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = store.cartStore.subscribe(listener);
    store.cartStore.add(printItem);
    store.cartStore.clear();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.cartStore.add(printItem);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("picks up cart changes from other tabs, ignoring other storage keys", () => {
    const listener = vi.fn();
    const unsubscribe = store.cartStore.subscribe(listener);
    window.dispatchEvent(new StorageEvent("storage", { key: "something-else" }));
    expect(listener).not.toHaveBeenCalled();
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    expect(listener).toHaveBeenCalledOnce();
  });
});

describe("toThumb", () => {
  it("keeps only the fields the cart needs", () => {
    const image = { src: "/a.jpg", width: 1, height: 1, alt: "A" };
    const artwork = { ...thumb, image, slug: "golden-hour-hills", price: 10, description: ["x"] };
    expect(store.toThumb(artwork)).toEqual({ ...thumb, image });
  });
});
