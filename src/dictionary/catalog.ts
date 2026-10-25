import type { DictionaryDocument, Vec3 } from "./types";

export interface Term {
  slug: string;
  title: string;
  description: string;
  body: string;
  usage: string[];
  avoid: string;
  links: string[];
  section: number;
  layout: Vec3;
  radius: number;
}

export interface GraphEdge {
  source: number;
  target: number;
  bend: Vec3;
}

export interface SectionInfo {
  title: string;
  index: number;
  slugs: string[];
}

export interface TermPlace {
  index: number;
  total: number;
  sectionTitle: string;
  sectionIndex: number;
  prev: string | null;
  next: string | null;
}

export interface Catalog {
  source: string;
  terms: Term[];
  edges: GraphEdge[];
  sections: SectionInfo[];
  spread: number;
  term(slug: string): Term | undefined;
  indexOf(slug: string): number;
  neighbors(slug: string): string[];
  place(slug: string): TermPlace | undefined;
  search(query: string): string[];
  linkTarget(href: string): string | null;
}

const RADIUS_FLOOR = 2.2;
const RADIUS_SPAN = 6.5;
const RADIUS_DEGREE_CAP = 37;

export function termRadius(inDegree: number): number {
  return RADIUS_FLOOR + (Math.log1p(inDegree) / Math.log1p(RADIUS_DEGREE_CAP)) * RADIUS_SPAN;
}

export function createCatalog(doc: DictionaryDocument): Catalog {
  const terms: Term[] = [];
  const bySlug = new Map<string, Term>();
  const indexBySlug = new Map<string, number>();
  const degree = new Map<string, number>();

  for (const edge of doc.edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }

  doc.nodes.forEach((node, index) => {
    const term: Term = {
      slug: node.slug,
      title: node.title,
      description: node.description,
      body: node.body,
      usage: node.usage,
      avoid: node.avoid,
      links: node.links,
      section: node.section,
      layout: node.layout,
      radius: termRadius(degree.get(node.slug) ?? 0),
    };
    terms.push(term);
    bySlug.set(term.slug, term);
    indexBySlug.set(term.slug, index);
  });

  const titleSlug = new Map(terms.map((term) => [term.title.toLowerCase(), term.slug]));
  const edges: GraphEdge[] = [];
  for (const edge of doc.edges) {
    const source = indexBySlug.get(edge.source);
    const target = indexBySlug.get(edge.target);
    if (source === undefined || target === undefined) continue;
    const a = terms[source].layout;
    const b = terms[target].layout;
    edges.push({
      source,
      target,
      bend: [
        edge.control[0] - (a[0] + b[0]) / 2,
        edge.control[1] - (a[1] + b[1]) / 2,
        edge.control[2] - (a[2] + b[2]) / 2,
      ],
    });
  }

  const neighborSets = new Map<string, string[]>();
  for (const edge of doc.edges) {
    pushNeighbor(neighborSets, edge.source, edge.target);
    pushNeighbor(neighborSets, edge.target, edge.source);
  }

  const order: string[] = [];
  for (const section of doc.sections) {
    for (const slug of section.slugs) {
      if (bySlug.has(slug)) order.push(slug);
    }
  }
  const orderIndex = new Map(order.map((slug, index) => [slug, index]));

  let spread = 1;
  for (const term of terms) {
    spread = Math.max(spread, Math.hypot(term.layout[0], term.layout[1], term.layout[2]) + term.radius);
  }

  return {
    source: doc.source,
    terms,
    edges,
    sections: doc.sections.map((section) => ({
      title: section.title,
      index: section.index,
      slugs: section.slugs,
    })),
    spread,
    term: (slug) => bySlug.get(slug),
    indexOf: (slug) => indexBySlug.get(slug) ?? -1,
    neighbors: (slug) => neighborSets.get(slug) ?? [],
    place: (slug) => {
      const term = bySlug.get(slug);
      const index = orderIndex.get(slug);
      if (!term || index === undefined) return undefined;
      const section = doc.sections[term.section];
      return {
        index: index + 1,
        total: order.length,
        sectionTitle: section?.title ?? "",
        sectionIndex: term.section,
        prev: order[index - 1] ?? null,
        next: order[index + 1] ?? null,
      };
    },
    search: (query) => searchTerms(terms, query),
    linkTarget: (href) => {
      const file = decodeURIComponent(href.split("/").pop() ?? "").replace(/\.md$/i, "");
      const fromTitle = titleSlug.get(file.toLowerCase());
      if (fromTitle) return fromTitle;
      const slug = file.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return bySlug.has(slug) ? slug : null;
    },
  };
}

function pushNeighbor(map: Map<string, string[]>, from: string, to: string) {
  const list = map.get(from);
  if (!list) {
    map.set(from, [to]);
    return;
  }
  if (!list.includes(to)) list.push(to);
}

function searchTerms(terms: Term[], query: string): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return terms
    .filter((term) => {
      const haystack = `${term.title} ${term.slug}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    })
    .map((term) => term.slug);
}
