import { afterEach } from "vitest";

// Only component tests run in jsdom; load DOM helpers there alone.
if (typeof window !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });
}
