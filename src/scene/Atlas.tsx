import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Catalog } from "../dictionary/catalog";
import type { GraphFrame } from "../graph/project";
import { Edges } from "./Edges";
import { Labels } from "./Labels";
import { Nodes } from "./Nodes";
import { PAPER } from "./palette";
import { Sparks } from "./Sparks";

interface AtlasProps {
  catalog: Catalog;
  frame: GraphFrame;
  tint: string | null;
  onFocus: (slug: string) => void;
  onHover: (slug: string | null) => void;
}

export function Atlas({ catalog, frame, tint, onFocus, onHover }: AtlasProps) {
  const controls = useRef<CameraControls>(null);
  const placed = useRef("");
  const dragging = useRef(false);
  const background = tint ?? PAPER;

  useEffect(() => {
    const camera = controls.current;
    if (!camera) return;
    const start = () => {
      dragging.current = true;
    };
    const end = () => {
      dragging.current = false;
    };
    camera.addEventListener("controlstart", start);
    camera.addEventListener("controlend", end);
    return () => {
      camera.removeEventListener("controlstart", start);
      camera.removeEventListener("controlend", end);
    };
  }, []);

  useFrame((_, delta) => {
    const camera = controls.current;
    if (!camera) return;
    const key = `${frame.lookAt[0].toFixed(2)}:${frame.lookAt[1].toFixed(2)}:${frame.lookAt[2].toFixed(2)}:${frame.distance.toFixed(1)}`;
    if (key !== placed.current) {
      placed.current = key;
      const [x, y, z] = frame.lookAt;
      const distance = frame.distance;
      void camera.setLookAt(x + distance * 0.42, y + distance * 0.22, z + distance * 0.78, x, y, z, true);
    }
    if (frame.idle && !dragging.current) camera.rotate(0.04 * delta, 0, true);
  });

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 680, 2300]} />
      <hemisphereLight args={["#f4f3ef", "#b9b6ae", 0.85]} />
      <directionalLight position={[120, 180, 80]} intensity={1.7} />
      <directionalLight position={[-90, -40, -30]} intensity={0.35} />
      <CameraControls
        ref={controls}
        makeDefault
        smoothTime={0.45}
        minDistance={70}
        maxDistance={1200}
        dollyToCursor
      />
      <Edges catalog={catalog} frame={frame} />
      <Sparks catalog={catalog} frame={frame} />
      <Nodes catalog={catalog} frame={frame} tint={tint} onFocus={onFocus} onHover={onHover} />
      <Labels catalog={catalog} frame={frame} />
    </>
  );
}
