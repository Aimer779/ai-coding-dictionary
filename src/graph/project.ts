import type { Catalog } from "../dictionary/catalog";
import type { Vec3 } from "../dictionary/types";
import { repack, type ForceBody } from "./force";

export interface GraphFocus {
  focused: string | null;
  hovered: string | null;
}

export interface GraphLayout {
  positions: Float32Array;
  visible: Float32Array;
  matched: string[];
  controlScale: number;
  subjectRadius: number;
  origin: Vec3;
}

export interface GraphFrame {
  positions: Float32Array;
  visible: Float32Array;
  edgeBright: Float32Array;
  controlScale: number;
  lookAt: Vec3;
  distance: number;
  idle: boolean;
  active: string | null;
  matched: string[];
}

const REST_BRIGHT = 0.015;
const LINKED_BRIGHT = 0.6;
const GHOST_BRIGHT = 0.022;
const SEARCH_BRIGHT = 0.28;
const OVERVIEW_DISTANCE = 760;
const FOCUS_DISTANCE = (radius: number, fromOrigin: number) => {
  const base = Math.min(1100, 230 + 9 * radius);
  return base * (1 - 0.28 * (1 - Math.min(1, fromOrigin / 210)));
};

export function layoutGraph(catalog: Catalog, query: string): GraphLayout {
  const count = catalog.terms.length;
  const positions = new Float32Array(count * 3);
  const visible = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const home = catalog.terms[i].layout;
    positions[i * 3] = home[0];
    positions[i * 3 + 1] = home[1];
    positions[i * 3 + 2] = home[2];
    visible[i] = 1;
  }

  const matched = catalog.search(query);
  if (matched.length === 0) {
    return {
      positions,
      visible,
      matched,
      controlScale: 1,
      subjectRadius: catalog.spread,
      origin: [0, 0, 0],
    };
  }

  visible.fill(0);
  const indexes = matched
    .map((slug) => catalog.indexOf(slug))
    .filter((index) => index >= 0);

  if (indexes.length === 1) {
    const index = indexes[0];
    positions[index * 3] = 0;
    positions[index * 3 + 1] = 0;
    positions[index * 3 + 2] = 0;
    visible[index] = 1;
    return {
      positions,
      visible,
      matched,
      controlScale: 0,
      subjectRadius: catalog.terms[index].radius + 16,
      origin: [0, 0, 0],
    };
  }

  const local = new Map(indexes.map((index, order) => [index, order]));
  const bodies: ForceBody[] = indexes.map((index) => {
    const term = catalog.terms[index];
    return {
      x: term.layout[0],
      y: term.layout[1],
      z: term.layout[2],
      vx: 0,
      vy: 0,
      vz: 0,
      r: term.radius,
    };
  });
  const links = catalog.edges.flatMap((edge) => {
    const a = local.get(edge.source);
    const b = local.get(edge.target);
    return a === undefined || b === undefined ? [] : [{ a, b }];
  });
  const subjectRadius = repack(bodies, links);
  for (let order = 0; order < indexes.length; order += 1) {
    const index = indexes[order];
    const body = bodies[order];
    positions[index * 3] = body.x;
    positions[index * 3 + 1] = body.y;
    positions[index * 3 + 2] = body.z;
    visible[index] = 1;
  }
  return {
    positions,
    visible,
    matched,
    controlScale: 0,
    subjectRadius,
    origin: [0, 0, 0],
  };
}

export function paintGraph(catalog: Catalog, layout: GraphLayout, focus: GraphFocus): GraphFrame {
  const active = focus.focused ?? focus.hovered;
  const activeIndex = active ? catalog.indexOf(active) : -1;
  const searching = layout.matched.length > 0;
  const edgeBright = new Float32Array(catalog.edges.length);

  for (let i = 0; i < catalog.edges.length; i += 1) {
    const edge = catalog.edges[i];
    const sourceVisible = layout.visible[edge.source] > 0.5;
    const targetVisible = layout.visible[edge.target] > 0.5;
    const touches = edge.source === activeIndex || edge.target === activeIndex;
    if (searching) {
      edgeBright[i] = sourceVisible && targetVisible ? (active && touches ? LINKED_BRIGHT : SEARCH_BRIGHT) : 0;
    } else if (active) {
      edgeBright[i] = touches ? LINKED_BRIGHT : GHOST_BRIGHT;
    } else {
      edgeBright[i] = REST_BRIGHT;
    }
  }

  const camera = cameraFor(catalog, layout, focus.focused);
  return {
    positions: layout.positions,
    visible: layout.visible,
    edgeBright,
    controlScale: layout.controlScale,
    lookAt: camera.lookAt,
    distance: camera.distance,
    idle: !searching && !focus.focused && !focus.hovered,
    active,
    matched: layout.matched,
  };
}

function cameraFor(catalog: Catalog, layout: GraphLayout, focused: string | null): { lookAt: Vec3; distance: number } {
  if (focused) {
    const index = catalog.indexOf(focused);
    if (index >= 0 && layout.visible[index] > 0.5) {
      const lookAt: Vec3 = [
        layout.positions[index * 3],
        layout.positions[index * 3 + 1],
        layout.positions[index * 3 + 2],
      ];
      const fromOrigin = Math.hypot(lookAt[0], lookAt[1], lookAt[2]);
      return { lookAt, distance: FOCUS_DISTANCE(catalog.terms[index].radius, fromOrigin) };
    }
  }
  if (layout.matched.length > 0) {
    return { lookAt: [0, 0, 0], distance: Math.min(1200, Math.max(120, layout.subjectRadius * 2.4)) };
  }
  return { lookAt: [0, 0, 0], distance: OVERVIEW_DISTANCE };
}
