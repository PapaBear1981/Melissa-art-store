import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiVersion, dataset, projectId } from "./env";
import { getWriteClient } from "./writeClient";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn(() => ({ kind: "write-client" })) }));
vi.mock("next-sanity", () => ({ createClient }));

beforeEach(() => {
  createClient.mockClear();
});

describe("getWriteClient", () => {
  it("returns null when no write token is set", () => {
    vi.stubEnv("SANITY_API_WRITE_TOKEN", "");
    expect(getWriteClient()).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("creates an uncached client with the write token", () => {
    vi.stubEnv("SANITY_API_WRITE_TOKEN", "editor-tok");
    expect(getWriteClient()).toEqual({ kind: "write-client" });
    expect(createClient).toHaveBeenCalledWith({ projectId, dataset, apiVersion, token: "editor-tok", useCdn: false });
  });
});
