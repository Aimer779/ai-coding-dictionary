import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3, type PerspectiveCamera } from "three";
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
  framed: boolean;
  onFocus: (slug: string) => void;
  onHover: (slug: string | null) => void;
}

const EYE = new Vector3(0.42, 0.22, 0.78);
const UP = new Vector3(0, 1, 0);
const nodePoint = new Vector3();
const eyePoint = new Vector3();
const viewPoint = new Vector3();
const rightPoint = new Vector3();
const targetPoint = new Vector3();

export function Atlas({ catalog, frame, tint, framed, onFocus, onHover }: AtlasProps) {
  const controls = useRef<CameraControls>(null);
  const { size, camera } = useThree();
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
    const rig = controls.current;
    if (!rig) return;
    const key = `${frame.lookAt[0].toFixed(2)}:${frame.lookAt[1].toFixed(2)}:${frame.lookAt[2].toFixed(2)}:${frame.distance.toFixed(1)}:${framed ? size.width : 0}`;
    if (key !== placed.current) {
      placed.current = key;
      const [x, y, z] = frame.lookAt;
      const distance = frame.distance;
      nodePoint.set(x, y, z);
      eyePoint.copy(EYE).normalize().multiplyScalar(distance).add(nodePoint);
      targetPoint.copy(nodePoint);
      if (framed && size.width >= 800) {
        viewPoint.copy(nodePoint).sub(eyePoint).normalize();
        rightPoint.crossVectors(viewPoint, UP).normalize();
        const fov = (camera as PerspectiveCamera).fov;
        const halfWidth = distance * Math.tan((fov * Math.PI) / 360) * (size.width / size.height);
        targetPoint.add(rightPoint.multiplyScalar(halfWidth / 3));
      }
      void rig.setLookAt(eyePoint.x, eyePoint.y, eyePoint.z, targetPoint.x, targetPoint.y, targetPoint.z, true);
    }
    if (frame.idle && !dragging.current) rig.rotate(0.04 * delta, 0, true);
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
        smoothTime={0.55}
        minDistance={70}
        maxDistance={1200}
        dollyToCursor
      />
      <Edges catalog={catalog} frame={frame} />
      <Sparks catalog={catalog} frame={frame} />
      <Nodes catalog={catalog} frame={frame} paper={background} onFocus={onFocus} onHover={onHover} />
      <Labels catalog={catalog} frame={frame} />
    </>
  );
}
