import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@/": `${src}/`,
      // `server-only` throws outside a React Server Components build.
      "server-only": fileURLToPath(new URL("./test/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        // Async Server Components can't render in Vitest; the Playwright
        // tests in e2e/ load every page instead.
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/not-found.tsx",
        "src/components/layout/Footer.tsx",
        // Type declarations only.
        "src/lib/types.ts",
      ],
      reporter: ["text", "html", "lcov"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
