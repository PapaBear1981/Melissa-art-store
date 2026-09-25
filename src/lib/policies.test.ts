import { describe, expect, it } from "vitest";
import { footerNav } from "@/config/site";
import { policies } from "./policies";

describe("policies", () => {
  it("have unique slugs and non-empty sections", () => {
    expect(new Set(policies.map((p) => p.slug)).size).toBe(policies.length);
    for (const p of policies) {
      expect(p.title).not.toBe("");
      expect(p.sections.length).toBeGreaterThan(0);
      for (const s of p.sections) expect(s.paragraphs.length, `${p.slug}: ${s.heading}`).toBeGreaterThan(0);
    }
  });

  it("exist for every policy page linked in the footer", () => {
    const slugs = policies.map((p) => p.slug);
    const linked = footerNav
      .map((l) => l.href)
      .filter((href) => href.startsWith("/policies/"))
      .map((href) => href.slice("/policies/".length));
    expect(linked.length).toBeGreaterThan(0);
    for (const slug of linked) expect(slugs).toContain(slug);
  });
});
