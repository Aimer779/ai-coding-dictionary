import { describe, expect, it } from "vitest";
import { definitionBody, parseMarkdown } from "./prose";

const body = [
  "Lead sentence with _emphasis_.",
  "",
  "The three terms separate cleanly:",
  "",
  "| Term | What it names |",
  "| --- | --- |",
  "| Context | The task |",
  "| Context window | The literal [token](./Token.md) sequence |",
  "",
  "A later `getUser()` note.",
  "",
  "_Usage:_",
  "",
  '"A quote."',
].join("\n");

describe("definition markdown", () => {
  it("drops the lead and the usage tail before parsing", () => {
    const blocks = parseMarkdown(definitionBody(body), (href) => (href.endsWith("Token.md") ? "token" : null));
    expect(blocks.map((block) => block.type)).toEqual(["p", "table", "p"]);
    const table = blocks[1];
    expect(table.type).toBe("table");
    if (table.type !== "table") return;
    expect(table.headers[0][0]).toEqual({ type: "text", text: "Term" });
    expect(table.rows[1][1]).toContainEqual({ type: "link", text: "token", slug: "token" });
    expect(blocks[2]).toMatchObject({ type: "p", inlines: expect.arrayContaining([{ type: "code", text: "getUser()" }]) });
  });
});
