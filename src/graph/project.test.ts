import { describe, expect, it } from "vitest";
import { createCatalog } from "../dictionary/catalog";
import { definitionBody } from "../dictionary/prose";
import type { DictionaryDocument } from "../dictionary/types";
import { sampleCurve } from "./curve";
import { layoutGraph, paintGraph } from "./project";

const doc: DictionaryDocument = {
  source: "fixture",
  sections: [{ title: "The Model", index: 0, slugs: ["alpha", "beta", "context-window"] }],
  nodes: [
    {
      slug: "alpha",
      title: "Alpha",
      description: "First",
      body: "First paragraph.\n\nThe rest of the definition mentions [Beta](./Beta.md).",
      usage: ["Question", "Answer"],
      avoid: "synonym",
      links: ["beta"],
      section: 0,
      layout: [0, 0, 0],
    },
    {
      slug: "beta",
      title: "Beta",
      description: "Second",
      body: "Second.",
      usage: [],
      avoid: "",
      links: ["alpha"],
      section: 0,
      layout: [80, 0, 0],
    },
    {
      slug: "context-window",
      title: "Context window",
      description: "Window",
      body: "Window.",
      usage: [],
      avoid: "",
      links: [],
      section: 0,
      layout: [0, 90, 0],
    },
  ],
  edges: [{ source: "alpha", target: "beta", control: [40, 30, 0] }],
};

const catalog = createCatalog(doc);

describe("catalog", () => {
  it("resolves a markdown link by title and reports place", () => {
    expect(catalog.linkTarget("./Beta.md")).toBe("beta");
    expect(catalog.place("beta")).toMatchObject({ index: 2, total: 3, prev: "alpha", next: "context-window" });
    expect(definitionBody(doc.nodes[0].body)).toBe("The rest of the definition mentions [Beta](./Beta.md).");
  });

  it("matches every query word against the title", () => {
    expect(catalog.search("context window")).toEqual(["context-window"]);
    expect(catalog.search("")).toEqual([]);
  });
});

describe("graph frame", () => {
  it("keeps home positions and a faint web with nothing selected", () => {
    const layout = layoutGraph(catalog, "");
    const frame = paintGraph(catalog, layout, { focused: null, hovered: null });
    expect(layout.positions[3]).toBe(80);
    expect(frame.controlScale).toBe(1);
    expect(frame.edgeBright[0]).toBeCloseTo(0.015);
    expect(frame.idle).toBe(true);
  });

  it("brightens only the edges that touch the focused term", () => {
    const layout = layoutGraph(catalog, "");
    const frame = paintGraph(catalog, layout, { focused: "alpha", hovered: null });
    expect(frame.edgeBright[0]).toBeCloseTo(0.6);
    expect(frame.lookAt).toEqual([0, 0, 0]);
    expect(frame.idle).toBe(false);
  });

  it("moves a single search hit to the origin and straightens links", () => {
    const layout = layoutGraph(catalog, "context window");
    expect(layout.controlScale).toBe(0);
    expect(layout.visible[2]).toBe(1);
    expect(layout.visible[0]).toBe(0);
    expect([layout.positions[6], layout.positions[7], layout.positions[8]]).toEqual([0, 0, 0]);
  });

  it("samples the baked bend at rest and a straight chord when scale is 0", () => {
    const bent = sampleCurve([0, 0, 0], [80, 0, 0], [0, 30, 0], 1, 0.5);
    const straight = sampleCurve([0, 0, 0], [80, 0, 0], [0, 30, 0], 0, 0.5);
    expect(bent[1]).toBeCloseTo(15);
    expect(straight).toEqual([40, 0, 0]);
  });
});
