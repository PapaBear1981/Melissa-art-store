import { test as base, expect } from "@playwright/test";

type Fixtures = {
  /** Console errors a test expects, e.g. the 404 a not-found page logs. */
  allowedConsoleErrors: RegExp[];
  consoleErrors: string[];
};

/** Fails any test whose page logs an error (hydration problems, crashes). */
export const test = base.extend<Fixtures>({
  allowedConsoleErrors: [[], { option: true }],
  consoleErrors: [
    async ({ page, allowedConsoleErrors }, use) => {
      const errors: string[] = [];
      const record = (text: string) => {
        if (!allowedConsoleErrors.some((re) => re.test(text))) errors.push(text);
      };
      page.on("console", (msg) => {
        if (msg.type() === "error") record(msg.text());
      });
      page.on("pageerror", (err) => record(err.message));
      await use(errors);
      expect(errors, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
