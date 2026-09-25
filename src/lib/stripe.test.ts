import { beforeEach, describe, expect, it, vi } from "vitest";

const { StripeCtor } = vi.hoisted(() => ({
  StripeCtor: vi.fn(function (this: { key: string }, key: string) {
    this.key = key;
  }),
}));

vi.mock("stripe", () => ({ default: StripeCtor }));

/** The client is cached in module state, so each test starts from a fresh module. */
async function loadStripe() {
  vi.resetModules();
  return import("./stripe");
}

beforeEach(() => {
  StripeCtor.mockClear();
});

describe("isStripeConfigured", () => {
  it("is true only when a secret key is set", async () => {
    const { isStripeConfigured } = await loadStripe();
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(isStripeConfigured()).toBe(false);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    expect(isStripeConfigured()).toBe(true);
  });
});

describe("getStripe", () => {
  it("throws when the secret key isn't set", async () => {
    const { getStripe } = await loadStripe();
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(() => getStripe()).toThrow("STRIPE_SECRET_KEY is not set");
    expect(StripeCtor).not.toHaveBeenCalled();
  });

  it("creates one client with the key and reuses it", async () => {
    const { getStripe } = await loadStripe();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    const first = getStripe();
    const second = getStripe();
    expect(first).toBe(second);
    expect(StripeCtor).toHaveBeenCalledTimes(1);
    expect(StripeCtor).toHaveBeenCalledWith("sk_test_abc");
    expect(first).toMatchObject({ key: "sk_test_abc" });
  });
});

describe("isTestMode", () => {
  it("is true for a test key", async () => {
    const { isTestMode } = await loadStripe();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    expect(isTestMode()).toBe(true);
  });

  it("is false for a live key", async () => {
    const { isTestMode } = await loadStripe();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_abc");
    expect(isTestMode()).toBe(false);
  });

  it("assumes test mode when no key is set", async () => {
    const { isTestMode } = await loadStripe();
    vi.stubEnv("STRIPE_SECRET_KEY", undefined);
    expect(isTestMode()).toBe(true);
  });
});
