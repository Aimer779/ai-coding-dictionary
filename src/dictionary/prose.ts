export interface ProsePart {
  text: string;
  slug: string | null;
}

export interface ProseBlock {
  parts: ProsePart[];
}

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

export function definitionBody(body: string): string {
  const withoutNotes = body.split(/\n_Avoid:_/)[0]?.trim() ?? body.trim();
  const paragraphs = withoutNotes.split(/\n\n/);
  const rest = paragraphs.slice(1).join("\n\n").trim();
  return rest || withoutNotes;
}

export function proseBlocks(markdown: string, resolve: (href: string) => string | null): ProseBlock[] {
  return markdown
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({ parts: partsOf(paragraph, resolve) }));
}

function partsOf(paragraph: string, resolve: (href: string) => string | null): ProsePart[] {
  const parts: ProsePart[] = [];
  let cursor = 0;
  for (const match of paragraph.matchAll(LINK)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ text: paragraph.slice(cursor, index), slug: null });
    parts.push({ text: match[1], slug: resolve(match[2]) });
    cursor = index + match[0].length;
  }
  if (cursor < paragraph.length) parts.push({ text: paragraph.slice(cursor), slug: null });
  return parts;
}
