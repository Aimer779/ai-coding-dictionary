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
  useFrame(() => {
    const node = sprite.current;
    if (!node) return;
    const visible = frame.visible[index];
    node.visible = visible > 0.45;
    node.position.set(
      frame.positions[index * 3],
      frame.positions[index * 3 + 1] + radius + 4.5,
      frame.positions[index * 3 + 2],
    );
    const scale = 18 + radius;
    node.scale.set(scale * 4.2, scale * 0.55, 1);
  });
  return (
    <sprite ref={sprite} renderOrder={2}>
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
  context.fillStyle = "#5f5e5a";
  context.font = '600 28px "Courier New", ui-monospace, monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(title.toUpperCase(), 256, 34);
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
