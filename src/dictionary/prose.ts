export type Inline =
  | { type: "text"; text: string }
  | { type: "em"; text: string }
  | { type: "strong"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; slug: string | null };

export type Block =
  | { type: "p"; inlines: Inline[] }
  | { type: "ul"; items: Inline[][] }
  | { type: "table"; headers: Inline[][]; rows: Inline[][][] };

export function definitionBody(body: string): string {
  const cut = body.split(/\n_(?:Avoid|Usage):_/)[0]?.trim() ?? body.trim();
  const rest = cut.split(/\n\n/).slice(1).join("\n\n").trim();
  return rest || cut;
}

export function parseMarkdown(markdown: string, resolve: (href: string) => string | null): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;
  while (index < lines.length) {
    if (!lines[index].trim()) {
      index += 1;
      continue;
    }
    if (lines[index].trim().startsWith("|")) {
      const table: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        table.push(lines[index]);
        index += 1;
      }
      const parsed = parseTable(table, resolve);
      if (parsed) blocks.push(parsed);
      continue;
    }
    if (lines[index].trim().startsWith("- ")) {
      const items: Inline[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(parseInline(lines[index].trim().slice(2), resolve));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("|") &&
      !lines[index].trim().startsWith("- ")
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "p", inlines: parseInline(paragraph.join(" "), resolve) });
  }
  return blocks;
}

function parseTable(lines: string[], resolve: (href: string) => string | null): Block | null {
  const rows = lines
    .map(splitRow)
    .filter((row) => row.some((cell) => cell && !/^:?-{3,}:?$/.test(cell)));
  if (rows.length === 0) return null;
  const [header, ...body] = rows;
  return {
    type: "table",
    headers: header.map((cell) => parseInline(cell, resolve)),
    rows: body.map((row) => row.map((cell) => parseInline(cell, resolve))),
  };
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function parseInline(text: string, resolve: (href: string) => string | null): Inline[] {
  const inlines: Inline[] = [];
  let rest = text;
  while (rest.length > 0) {
    const token = nextToken(rest, resolve);
    if (!token) {
      inlines.push({ type: "text", text: rest });
      break;
    }
    if (token.index > 0) inlines.push({ type: "text", text: rest.slice(0, token.index) });
    inlines.push(token.inline);
    rest = rest.slice(token.index + token.length);
  }
  return inlines;
}

function nextToken(text: string, resolve: (href: string) => string | null) {
  const candidates: { index: number; length: number; inline: Inline }[] = [];
  const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(text);
  if (link?.index !== undefined) {
    candidates.push({
      index: link.index,
      length: link[0].length,
      inline: { type: "link", text: link[1], slug: resolve(link[2]) },
    });
  }
  const code = /`([^`]+)`/.exec(text);
  if (code?.index !== undefined) {
    candidates.push({ index: code.index, length: code[0].length, inline: { type: "code", text: code[1] } });
  }
  const strong = /\*\*([^*]+)\*\*/.exec(text);
  if (strong?.index !== undefined) {
    candidates.push({ index: strong.index, length: strong[0].length, inline: { type: "strong", text: strong[1] } });
  }
  const emphasis = /_([^_\n]+)_/.exec(text);
  if (emphasis?.index !== undefined) {
    candidates.push({ index: emphasis.index, length: emphasis[0].length, inline: { type: "em", text: emphasis[1] } });
  }
  candidates.sort((a, b) => a.index - b.index);
  return candidates[0] ?? null;
}
