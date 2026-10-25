export type Vec3 = [number, number, number];

export interface DictionaryNode {
  slug: string;
  title: string;
  description: string;
  body: string;
  usage: string[];
  avoid: string;
  links: string[];
  section: number;
  layout: Vec3;
}

export interface DictionaryEdge {
  source: string;
  target: string;
  control: Vec3;
}

export interface DictionarySection {
  title: string;
  index: number;
  slugs: string[];
}

export interface DictionaryDocument {
  source: string;
  sections: DictionarySection[];
  nodes: DictionaryNode[];
  edges: DictionaryEdge[];
}
