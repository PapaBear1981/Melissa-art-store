import { describe, expect, it, vi } from "vitest";

async function loadEnv(vars: { projectId?: string; dataset?: string }) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", vars.projectId ?? "");
  vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", vars.dataset ?? "");
  return import("./env");
}

describe("Sanity env", () => {
  it("uses the built-in project and production dataset by default", async () => {
    const env = await loadEnv({});
    expect(env).toMatchObject({ projectId: "8ii09o5j", dataset: "production", apiVersion: "2025-09-01", revalidateSeconds: 60 });
  });

  it("reads the project and dataset from the environment", async () => {
    const env = await loadEnv({ projectId: "abc123", dataset: "staging" });
    expect(env.projectId).toBe("abc123");
    expect(env.dataset).toBe("staging");
  });
});
