import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh } from "three";
import type { Catalog } from "../dictionary/catalog";
import type { GraphFrame } from "../graph/project";
import { NODE, PAPER } from "./palette";

interface NodesProps {
  catalog: Catalog;
  frame: GraphFrame;
  tint: string | null;
  onFocus: (slug: string) => void;
  onHover: (slug: string | null) => void;
}

export function Nodes({ catalog, frame, tint, onFocus, onHover }: NodesProps) {
  const shown = useRef(Float32Array.from(frame.visible));
  const color = tint ? PAPER : NODE;

  return (
    <group>
      {catalog.terms.map((term, index) => (
        <NodeMesh
          key={term.slug}
          index={index}
          radius={term.radius}
          frame={frame}
          shown={shown.current}
          color={color}
          onFocus={() => onFocus(term.slug)}
          onHover={(over) => onHover(over ? term.slug : null)}
        />
      ))}
    </group>
  );
}

function NodeMesh({
  index,
  radius,
  frame,
  shown,
  color,
  onFocus,
  onHover,
}: {
  index: number;
  radius: number;
  frame: GraphFrame;
  shown: Float32Array;
  color: string;
  onFocus: () => void;
  onHover: (over: boolean) => void;
}) {
  const mesh = useRef<Mesh>(null);
  const base = useMemo(() => radius, [radius]);

  useFrame(() => {
    const node = mesh.current;
    if (!node) return;
    const target = frame.visible[index];
    const current = shown[index];
    shown[index] = current + (target - current) * (target > current ? 0.22 : 0.08);
    node.position.set(frame.positions[index * 3], frame.positions[index * 3 + 1], frame.positions[index * 3 + 2]);
    const presence = shown[index];
    node.visible = presence > 0.05;
    node.scale.setScalar(Math.max(presence, 0.001));
  });

  return (
    <mesh
      ref={mesh}
      onClick={(event) => {
        event.stopPropagation();
        onFocus();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(true);
      }}
      onPointerOut={() => onHover(false)}
    >
      <sphereGeometry args={[base, 28, 20]} />
      <meshStandardMaterial color={color} roughness={0.62} metalness={0.04} />
    </mesh>
  );
}
