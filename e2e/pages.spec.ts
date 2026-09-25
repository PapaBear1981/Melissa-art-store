import { expect, test } from "./fixtures";

test("every page in the sitemap loads with a heading", async ({ page, request, baseURL }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const paths = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  // 8 static pages + 4 collections + 12 paintings + 3 policies
  expect(paths).toHaveLength(27);

  for (const path of [...paths, "/cart"]) {
    const res = await page.goto(`${baseURL}${path}`);
    expect(res?.status(), path).toBe(200);
    await expect(page.locator("h1").first(), path).toBeAttached();
  }
});

test.describe(() => {
  test.use({ allowedConsoleErrors: [/status of 404/] });

  test("unknown pages show the not-found page", async ({ page }) => {
    for (const path of ["/art/no-such-painting", "/collections/nope", "/policies/nope", "/nope"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
    }
    await expect(page.getByRole("link", { name: /gallery/i }).first()).toBeVisible();
  });
});

test("robots.txt keeps the cart and dashboard out of search", async ({ request }) => {
  const text = await (await request.get("/robots.txt")).text();
  expect(text).toContain("Disallow: /cart");
  expect(text).toContain("Disallow: /studio");
  expect(text).toMatch(/Sitemap: .*\/sitemap\.xml/);
});

test("the checkout success page handles a missing order", async ({ page }) => {
  await page.goto("/checkout/success?session_id=cs_test_unknown");
  await expect(page.getByRole("heading", { name: "We couldn't find that order" })).toBeVisible();
});

test("webhooks refuse requests when their secrets aren't set", async ({ request }) => {
  expect((await request.post("/api/stripe/webhook", { data: "{}" })).status()).toBe(500);
  expect((await request.post("/api/revalidate", { data: "{}" })).status()).toBe(500);
});
