import { expect, test } from "./fixtures";

test("the home slideshow moves between pages", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Explore the site" });
  const current = () => carousel.locator('[aria-roledescription="slide"][aria-hidden="false"]');

  await carousel.getByRole("button", { name: /pause slideshow/i }).click();
  await expect(current()).toHaveAttribute("aria-label", "1 of 6: Gallery");
  await carousel.getByRole("button", { name: "Next slide" }).click();
  await expect(current()).toHaveAttribute("aria-label", "2 of 6: Collections");
  await carousel.getByRole("button", { name: "Previous slide" }).click();
  await carousel.getByRole("button", { name: "Previous slide" }).click();
  await expect(current()).toHaveAttribute("aria-label", "6 of 6: Contact");

  await current().getByRole("link", { name: /get in touch/i }).click();
  await expect(page).toHaveURL(/\/contact$/);
});

test("the menu bar marks the current page", async ({ page }) => {
  await page.goto("/shop");
  const nav = page.getByRole("navigation", { name: "Main" }).filter({ visible: true });
  await expect(nav.getByRole("link", { name: "Shop" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Gallery" }).click();
  await expect(page).toHaveURL(/\/gallery$/);
  await expect(nav.getByRole("link", { name: "Gallery" })).toHaveAttribute("aria-current", "page");
});

test("gallery filters narrow the paintings shown", async ({ page }) => {
  await page.goto("/gallery");
  await expect(page.getByText("12 paintings shown")).toBeAttached();
  await page.getByRole("group", { name: "Filter by collection" }).getByRole("button", { name: "Big & Bold" }).click();
  await expect(page.getByText(/^[1-9]\d? paintings shown$/)).toBeAttached();
  await expect(page.getByText("12 paintings shown")).not.toBeAttached();
});

test("the lightbox opens and closes", async ({ page }) => {
  await page.goto("/art/golden-hour-hills");
  await page.getByRole("button", { name: "View Golden Hour Hills full screen" }).click();
  const dialog = page.getByRole("dialog", { name: "Golden Hour Hills, full screen" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
});
