import { expect, test } from "./fixtures";

test("contact form checks fields, then sends", async ({ page: tab }) => {
  await tab.goto("/contact");
  const page = tab.getByRole("main");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please check the highlighted fields." })).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");

  await page.getByLabel("Your name").fill("Test Buyer");
  await page.getByLabel("Email", { exact: true }).fill("buyer@example.com");
  await page.getByLabel("What's this about?").selectOption("original");
  await page.getByLabel("Message").fill("Is the big sunset painting still available?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toHaveText(/Your message is on its way/);
});

test("commission form sends a request", async ({ page: tab }) => {
  await tab.goto("/commissions");
  const page = tab.getByRole("main");
  await page.getByLabel("Your name").fill("Test Buyer");
  await page.getByLabel("Email", { exact: true }).fill("buyer@example.com");
  await page.getByLabel("Size", { exact: true }).selectOption("24″ × 30″");
  await page.getByLabel("What would you like painted?").fill("Our family cabin by the lake at sunset.");
  await page.getByLabel("Budget").selectOption("$1,500 – $3,000");
  await page.getByLabel("Shipping to (city, country)").fill("Denver, USA");
  await page.getByLabel(/Reference photos/).setInputFiles({
    name: "cabin.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"),
  });
  await page.getByRole("button", { name: "Send commission request" }).click();
  await expect(page.getByRole("status")).toHaveText(/commission request has been sent/);
});

test("newsletter signup in the footer", async ({ page }) => {
  await page.goto("/about");
  const footer = page.getByRole("contentinfo");
  await footer.getByLabel("Email address").fill("not-an-email");
  await footer.getByRole("button", { name: "Subscribe" }).click();
  await expect(footer.getByRole("alert")).toHaveText("Please enter a valid email address.");
  await footer.getByLabel("Email address").fill("fan@example.com");
  await footer.getByRole("button", { name: "Subscribe" }).click();
  await expect(footer.getByRole("status")).toHaveText(/on the list/);
});
