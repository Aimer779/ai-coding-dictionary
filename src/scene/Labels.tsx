import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, Sprite } from "three";
import type { Catalog } from "../dictionary/catalog";
import type { GraphFrame } from "../graph/project";

interface LabelsProps {
  catalog: Catalog;
  frame: GraphFrame;
}

export function Labels({ catalog, frame }: LabelsProps) {
  const textures = useMemo(() => catalog.terms.map((term) => labelTexture(term.title)), [catalog]);
  return (
    <group>
      {catalog.terms.map((term, index) => (
        <LabelSprite
          key={term.slug}
          index={index}
          radius={term.radius}
          frame={frame}
          texture={textures[index]}
        />
      ))}
    </group>
  );
}

function LabelSprite({
  index,
  radius,
  frame,
  texture,
}: {
  index: number;
  radius: number;
  frame: GraphFrame;
  texture: CanvasTexture;
}) {
  const sprite = useRef<Sprite>(null);
  const sink = useRef(0);
  useFrame((_, delta) => {
    const node = sprite.current;
    if (!node) return;
    const visible = frame.visible[index];
    const unrelated = frame.focusIndex >= 0 && frame.nodeState[index] <= 0.05;
    const target = unrelated ? 1 : 0;
    sink.current += (target - sink.current) * (1 - (target > sink.current ? 0.16 : 0.012) ** delta);
    node.visible = visible > 0.45;
    node.position.set(
      frame.positions[index * 3],
      frame.positions[index * 3 + 1] + radius + 4.5 - sink.current * (radius + 8),
      frame.positions[index * 3 + 2],
    );
    const scale = (16 + radius) * 0.78 * (1 - sink.current * 0.16);
    node.scale.set(scale * 4.2, scale * 0.55, 1);
    const material = node.material;
    if (!Array.isArray(material)) material.opacity = 1 - sink.current * 0.95;
  });
  return (
    <sprite ref={sprite} renderOrder={2} raycast={() => null}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

function labelTexture(title: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return new CanvasTexture(canvas);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#6f6e6a";
  context.font = '600 26px ui-monospace, "Courier New", monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(title.toUpperCase(), 256, 34);
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
