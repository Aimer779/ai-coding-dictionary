import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, Vector3, type Group, type Object3D } from "three";

interface GraphText {
  fillOpacity: number;
  outlineOpacity: number;
  color: string;
}
import type { Catalog } from "../dictionary/catalog";
import type { GraphFrame } from "../graph/project";
import { intro } from "../graph/intro";
import { live } from "./live";
import { pickedSlug } from "./pointer";

const FONT = `${import.meta.env.BASE_URL}fonts/mono/JetBrainsMono-Medium.ttf`;
const INK = "#1a1a19";
const ACCENT = "#0a0a0a";
const PAPER = "#f2f2f0";
const NEAR_OFFSET = 35;
const FAR_OFFSET = 200;
const LABEL_STRENGTH = 0.95;
const SEARCH_CUT = 0.78;
const SEARCH_NEAR = 90;
const nodePoint = new Vector3();
const screenUp = new Vector3();
const towardCamera = new Vector3();

function smoothstep(edge0: number, edge1: number, value: number) {
  const span = edge1 - edge0;
  if (span === 0) return value < edge0 ? 0 : 1;
  const t = Math.min(1, Math.max(0, (value - edge0) / span));
  return t * t * (3 - 2 * t);
}

function labelWeight(radius: number) {
  return Math.max(0, Math.min(1, (radius - 2.2) / (8.7 - 2.2)));
}

export function Labels({ catalog, frame }: { catalog: Catalog; frame: GraphFrame }) {
  const search = useRef(0);
  const linked = useMemo(() => {
    if (frame.focusIndex < 0) return new Set<string>();
    const slug = catalog.terms[frame.focusIndex]?.slug;
    return new Set(slug ? catalog.neighbors(slug) : []);
  }, [catalog, frame]);

  useFrame((_, delta) => {
    const goal = frame.matched.length > 0 ? 1 : 0;
    search.current += (goal - search.current) * (1 - 0.0009 ** delta);
  });

  return (
    <group>
      {catalog.terms.map((term, index) => (
        <GraphLabel
          key={term.slug}
          index={index}
          title={term.title.toUpperCase()}
          radius={term.radius}
          slug={term.slug}
          linked={linked.has(term.slug)}
          frame={frame}
          search={search}
        />
      ))}
    </group>
  );
}

function GraphLabel({
  index,
  title,
  radius,
  slug,
  linked,
  frame,
  search,
}: {
  index: number;
  title: string;
  radius: number;
  slug: string;
  linked: boolean;
  frame: GraphFrame;
  search: { current: number };
}) {
  const text = useRef<GraphText>(null);
  const group = useRef<Group>(null);
  const lift = useRef(0);
  const weight = labelWeight(radius);
  const fontSize = 2.1 + 2 * weight;
  const baseOpacity = 0.3 + 0.5 * weight;

  useFrame(({ camera }, delta) => {
    const label = text.current;
    const holder = group.current;
    if (!label || !holder) return;
    const blockRay = (object: Object3D) => {
      object.raycast = () => null;
    };
    blockRay(holder);
    holder.traverse(blockRay);
    const presence = frame.visible[index];
    const positions = live.positions.length === frame.positions.length ? live.positions : frame.positions;
    const x = positions[index * 3];
    const y = positions[index * 3 + 1];
    const z = positions[index * 3 + 2];
    const focused = frame.focusIndex >= 0;
    const self = slug === frame.active;
    const hovering = focused && !self && pickedSlug.current === slug;
    lift.current += ((hovering ? 1 : 0) - lift.current) * (1 - 0.0009 ** delta);
    const sink = focused && !self && !linked;
    const distance = Math.hypot(x - camera.position.x, y - camera.position.y, z - camera.position.z);
    const cameraDistance = camera.position.length();
    const near = cameraDistance - (NEAR_OFFSET + SEARCH_NEAR * search.current);
    const far = cameraDistance + FAR_OFFSET;
    const strength = LABEL_STRENGTH * (1 - SEARCH_CUT * search.current);
    const depth = 1 - smoothstep(near, far, distance) * strength;
    let opacity = baseOpacity * depth;
    if (sink) opacity *= 0.05;
    opacity = self ? 1 : opacity + (1 - opacity) * lift.current;
    const born = intro.active ? (intro.scale[index] ?? 0) : 1;
    opacity *= presence * born;
    label.fillOpacity = opacity;
    label.outlineOpacity = opacity;
    label.color = self ? ACCENT : INK;
    nodePoint.set(x, y, z);
    screenUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    towardCamera.copy(camera.position).sub(nodePoint).normalize();
    const gap = radius + 3 - (sink ? (1 - lift.current) * fontSize : 0);
    holder.position.copy(nodePoint).addScaledVector(screenUp, gap).addScaledVector(towardCamera, 8);
    holder.quaternion.copy(camera.quaternion);
    holder.scale.setScalar(sink ? 0.84 + 0.16 * lift.current : 1);
    holder.visible = presence > 0.02 && born > 0.02;
  }, 1);

  return (
    <group ref={group}>
      <Text
        ref={text}
        font={FONT}
        fontSize={fontSize}
        sdfGlyphSize={128}
        anchorX="center"
        anchorY="bottom"
        letterSpacing={0}
        color={INK}
        fillOpacity={baseOpacity}
        outlineColor={PAPER}
        outlineWidth="7%"
        outlineOpacity={baseOpacity}
        material-depthWrite={false}
        material-depthTest={false}
        renderOrder={10}
        material-side={DoubleSide}
        raycast={() => null}
      >
        {title}
      </Text>
    </group>
  );
}
