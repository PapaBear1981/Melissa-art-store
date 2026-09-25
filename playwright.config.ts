import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a production build that uses the built-in
 * sample paintings, so no Sanity, Stripe or Resend keys are needed.
 * Build first with `npm run build:e2e`, then run `npm run test:e2e`.
 */
const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    env: { USE_SAMPLE_CONTENT: "true" },
  },
});
