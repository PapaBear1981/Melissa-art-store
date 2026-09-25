/** @vitest-environment jsdom */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "@/lib/cart/CartProvider";
import { cartStore, toThumb } from "@/lib/cart/store";
import { startCheckout, type CheckoutResult } from "@/lib/checkout/actions";
import { getPrintOptions } from "@/lib/prints";
import { sampleArtworks } from "@/lib/sample-data";
import { CheckoutButton } from "./CheckoutButton";

vi.mock("@/lib/checkout/actions", () => ({ startCheckout: vi.fn() }));

const original = sampleArtworks.find((a) => a.slug === "golden-hour-hills")!;
const printed = sampleArtworks.find((a) => a.slug === "marigold-rhythm")!;
const print = getPrintOptions(printed)[0];

function seed() {
  cartStore.add({
    key: `${original.slug}:original`,
    slug: original.slug,
    kind: "original",
    title: original.title,
    detail: "Original painting",
    unitPrice: original.original.price!,
    thumb: toThumb(original),
  });
  cartStore.add(
    {
      key: `${printed.slug}:${print.id}`,
      slug: printed.slug,
      kind: "print",
      printOptionId: print.id,
      title: printed.title,
      detail: "Fine art print",
      unitPrice: print.price,
      thumb: toThumb(printed),
    },
    3,
  );
}

const renderButton = () => render(<CartProvider><CheckoutButton /></CartProvider>);
const checkoutButton = () => screen.getByRole("button", { name: /checkout/i });

let assign: ReturnType<typeof vi.fn>;
beforeEach(() => {
  assign = vi.fn();
  vi.stubGlobal("location", { ...window.location, assign });
});

describe("CheckoutButton", () => {
  it("is disabled while the cart is empty", () => {
    renderButton();
    expect(checkoutButton()).toBeDisabled();
  });

  it("ships to the US by default and sends the cart to Stripe checkout", async () => {
    vi.mocked(startCheckout).mockResolvedValue({ url: "https://checkout.stripe.test/s/1" });
    seed();
    renderButton();
    expect(screen.getByRole("radio", { name: "United States" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Another country" })).not.toBeChecked();

    await userEvent.click(checkoutButton());

    expect(startCheckout).toHaveBeenCalledWith(
      [
        { slug: original.slug, kind: "original", printOptionId: undefined, quantity: 1 },
        { slug: printed.slug, kind: "print", printOptionId: print.id, quantity: 3 },
      ],
      "us",
    );
    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.test/s/1");
  });

  it("passes an international destination through", async () => {
    vi.mocked(startCheckout).mockResolvedValue({ url: "https://checkout.stripe.test/s/2" });
    seed();
    renderButton();
    await userEvent.click(screen.getByRole("radio", { name: "Another country" }));
    expect(screen.getByRole("radio", { name: "Another country" })).toBeChecked();
    await userEvent.click(checkoutButton());
    expect(startCheckout).toHaveBeenCalledWith(expect.any(Array), "intl");

    await userEvent.click(screen.getByRole("radio", { name: "United States" }));
    await userEvent.click(checkoutButton());
    expect(startCheckout).toHaveBeenLastCalledWith(expect.any(Array), "us");
  });

  it("shows a pending state while checkout opens", async () => {
    let resolve!: (r: CheckoutResult) => void;
    vi.mocked(startCheckout).mockReturnValue(new Promise((r) => (resolve = r)));
    seed();
    renderButton();

    await userEvent.click(checkoutButton());
    expect(checkoutButton()).toHaveTextContent("Opening secure checkout…");
    expect(checkoutButton()).toBeDisabled();

    await act(async () => resolve({ url: "https://checkout.stripe.test/s/3" }));
    expect(checkoutButton()).toHaveTextContent("Secure checkout");
    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.test/s/3");
  });

  it("shows the error and clears it on the next attempt", async () => {
    vi.mocked(startCheckout).mockResolvedValueOnce({ error: "Tidewater has just sold." });
    seed();
    renderButton();

    await userEvent.click(checkoutButton());
    expect(screen.getByRole("alert")).toHaveTextContent("Tidewater has just sold.");
    expect(assign).not.toHaveBeenCalled();
    expect(checkoutButton()).toBeEnabled();

    let resolve!: (r: CheckoutResult) => void;
    vi.mocked(startCheckout).mockReturnValueOnce(new Promise((r) => (resolve = r)));
    await userEvent.click(checkoutButton());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await act(async () => resolve({ url: "https://checkout.stripe.test/s/4" }));
  });
});
