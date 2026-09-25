import { expect, test } from "./fixtures";

const cartButton = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: /^Open cart/ });

test("buying a print: choose options, add to cart, change quantity", async ({ page }) => {
  await page.goto("/art/golden-hour-hills");
  await page.getByRole("tab", { name: "Prints" }).click();
  await page.getByText("Stretched canvas").click();
  await page.getByLabel("Quantity").selectOption("2");
  await page.getByRole("button", { name: /^Add to cart · \$/ }).click();

  const drawer = page.getByRole("dialog", { name: "Shopping cart" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText(/Stretched canvas ·/)).toBeVisible();
  await expect(drawer.locator("[aria-live=polite]")).toHaveText("2");

  await drawer.getByRole("button", { name: "Increase quantity of Golden Hour Hills" }).click();
  await expect(drawer.locator("[aria-live=polite]")).toHaveText("3");
  await drawer.getByRole("button", { name: "Close cart" }).click();
  await expect(cartButton(page)).toHaveAccessibleName("Open cart, 3 items");

  // The cart survives a reload.
  await page.reload();
  await expect(cartButton(page)).toHaveAccessibleName("Open cart, 3 items");
});

test("an original can only be added once", async ({ page }) => {
  await page.goto("/art/peonies-in-june");
  await page.getByRole("button", { name: "Add original to cart" }).click();
  await page.getByRole("dialog", { name: "Shopping cart" }).getByRole("button", { name: "Close cart" }).click();
  await expect(page.getByRole("button", { name: "In your cart" })).toBeDisabled();
  await expect(cartButton(page)).toHaveAccessibleName("Open cart, 1 item");
});

test("the cart page shows the order and removes items", async ({ page }) => {
  await page.goto("/art/peonies-in-june");
  await page.getByRole("button", { name: "Add original to cart" }).click();
  await page.goto("/cart");

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Order summary" })).toBeVisible();
  await expect(main.getByText("One of a kind")).toBeVisible();
  await expect(main.getByText("$950").first()).toBeVisible();

  await main.getByRole("button", { name: "Remove" }).click();
  await expect(main.getByText("Your cart is empty.")).toBeVisible();
});

test("checkout explains when payments aren't switched on", async ({ page }) => {
  await page.goto("/art/peonies-in-june");
  await page.getByRole("button", { name: "Add original to cart" }).click();
  const drawer = page.getByRole("dialog", { name: "Shopping cart" });
  await drawer.getByText("Another country").click();
  await drawer.getByRole("button", { name: "Secure checkout" }).click();
  await expect(drawer.getByRole("alert")).toHaveText(/isn't switched on yet/);
});

test("sold and private pieces offer prints or inquiries instead", async ({ page }) => {
  // Sold originals with prints open on the Prints tab.
  await page.goto("/art/marigold-rhythm");
  await expect(page.getByRole("tab", { name: "Prints" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Original painting" }).click();
  await expect(page.getByText("The original has found its home.")).toBeVisible();
  await page.getByRole("button", { name: "See print options" }).click();
  await expect(page.getByRole("button", { name: /^Add to cart/ })).toBeVisible();

  await page.goto("/art/coral-and-teal");
  await expect(page.getByText("Price on request")).toBeVisible();
  await page.getByRole("button", { name: "Inquire about this piece" }).click();
  await expect(page.getByRole("button", { name: "Send inquiry" })).toBeVisible();
});

test("shop filters and sorting", async ({ page }) => {
  await page.goto("/shop");
  const count = page.getByText(/pieces shown$/);
  const all = Number((await count.textContent())?.split(" ")[0]);

  await page.getByRole("button", { name: "Original paintings" }).click();
  const originals = Number((await count.textContent())?.split(" ")[0]);
  expect(originals).toBeLessThan(all);

  await page.getByRole("combobox").selectOption("price-asc");
  await expect(page.getByRole("combobox")).toHaveValue("price-asc");
});
