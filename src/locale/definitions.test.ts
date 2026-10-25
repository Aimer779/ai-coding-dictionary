import { describe, expect, it } from "vitest";
import dictionary from "../data/dictionary.json";
import { zhDefinition } from "./definitions";
import { zhLede, zhUsage } from "./surface";

function hrefs(markdown: string) {
  return [...markdown.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]).sort();
}

describe("chinese definitions", () => {
  it("covers every term and keeps the same link targets", () => {
    for (const node of dictionary.nodes) {
      const translated = zhDefinition[node.slug];
      expect(translated?.trim().length).toBeGreaterThan(20);
      const cut = node.body.split(/\n_(?:Avoid|Usage):_/)[0]?.trim() ?? "";
      const parts = cut.split(/\n\n/);
      const body = parts.slice(1).join("\n\n").trim() || cut;
      expect(hrefs(translated)).toEqual(hrefs(body));
      expect(zhLede[node.slug]?.trim().length).toBeGreaterThan(4);
      expect(zhUsage[node.slug]?.length).toBe(node.usage.length);
    }
  });
});
