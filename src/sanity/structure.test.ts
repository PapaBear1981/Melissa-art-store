import type { StructureBuilder, StructureResolverContext } from "sanity/structure";
import { describe, expect, it } from "vitest";
import { structure } from "./structure";

interface FakeNode {
  kind: string;
  type?: string;
  props: Record<string, unknown>;
}

/** A chainable stand-in for Sanity's structure builder that records each setting. */
function fakeBuilder() {
  const node = (kind: string, type?: string) => {
    const n: FakeNode = { kind, type, props: {} };
    const chain = new Proxy(n, {
      get(target, prop: string) {
        if (prop === "kind" || prop === "type" || prop === "props") return target[prop];
        return (value: unknown) => {
          target.props[prop] = value;
          return chain;
        };
      },
    });
    return chain;
  };
  return {
    list: () => node("list"),
    listItem: () => node("listItem"),
    document: () => node("document"),
    divider: () => node("divider"),
    documentTypeListItem: (type: string) => node("documentTypeListItem", type),
  };
}

describe("dashboard structure", () => {
  const menu = structure(fakeBuilder() as unknown as StructureBuilder, {} as StructureResolverContext) as unknown as FakeNode;
  const items = menu.props.items as FakeNode[];

  it("is a list titled with the store name", () => {
    expect(menu.kind).toBe("list");
    expect(menu.props.title).toBe("Melissa's Art");
  });

  it("groups paintings, website-created records and singletons with dividers", () => {
    expect(items.map((i) => (i.kind === "divider" ? "---" : i.props.title))).toEqual([
      "Paintings",
      "Collections",
      "---",
      "Orders",
      "Commission requests",
      "---",
      "About page",
      "Contact details",
    ]);
    expect(items.filter((i) => i.kind === "documentTypeListItem").map((i) => i.type)).toEqual([
      "artwork",
      "collection",
      "order",
      "commissionRequest",
    ]);
  });

  it("opens the About page and contact details as single documents", () => {
    const singles = items.filter((i) => i.kind === "listItem");
    expect(singles.map((i) => i.props.id)).toEqual(["aboutPage", "siteSettings"]);
    expect(singles.map((i) => (i.props.child as FakeNode).props)).toEqual([
      { schemaType: "aboutPage", documentId: "aboutPage" },
      { schemaType: "siteSettings", documentId: "siteSettings" },
    ]);
  });
});
