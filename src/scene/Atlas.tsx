import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { Catalog } from "../dictionary/catalog";
import type { GraphFrame } from "../graph/project";
import { Edges } from "./Edges";
import { FocusRing } from "./FocusRing";
import { useGrade } from "./Grade";
import { Labels } from "./Labels";
import { Nodes } from "./Nodes";
import { NODE_PAPER } from "./palette";
import { Sparks } from "./Sparks";

interface AtlasProps {
  catalog: Catalog;
  frame: GraphFrame;
  shadow: string;
  highlight: string;
  framed: boolean;
  onFocus: (slug: string) => void;
  onHover: (slug: string | null) => void;
}

const HOME = new Vector3(130, 100, 540).normalize();
const nodePoint = new Vector3();
const eyePoint = new Vector3();
const radial = new Vector3();

export function Atlas({ catalog, frame, shadow, highlight, framed, onFocus, onHover }: AtlasProps) {
  const controls = useRef<CameraControls>(null);
  const duotone = useGrade({ shadow, highlight });
  const placed = useRef("");
  const dragging = useRef(false);
  const background = NODE_PAPER;

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
    const key = `${frame.lookAt[0].toFixed(2)}:${frame.lookAt[1].toFixed(2)}:${frame.lookAt[2].toFixed(2)}:${frame.distance.toFixed(1)}:${framed ? 1 : 0}`;
    if (key !== placed.current) {
      placed.current = key;
      const [x, y, z] = frame.lookAt;
      nodePoint.set(x, y, z);
      radial.copy(nodePoint);
      if (radial.lengthSq() < 1) radial.copy(HOME);
      radial.normalize().multiplyScalar(frame.distance);
      eyePoint.copy(nodePoint).add(radial);
      rig.smoothTime = framed ? 0.5 : 0.28;
      void rig.setLookAt(eyePoint.x, eyePoint.y, eyePoint.z, nodePoint.x, nodePoint.y, nodePoint.z, true);
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
        smoothTime={0.28}
        draggingSmoothTime={0.1}
        azimuthRotateSpeed={0.6}
        polarRotateSpeed={0.6}
        minDistance={70}
        maxDistance={1200}
        dollyToCursor
      />
      <Edges catalog={catalog} frame={frame} />
      <Sparks catalog={catalog} frame={frame} />
      <Nodes catalog={catalog} frame={frame} paper={background} onFocus={onFocus} onHover={onHover} />
      <FocusRing catalog={catalog} frame={frame} />
      <Labels catalog={catalog} frame={frame} />
      <EffectComposer multisampling={0}>
        <primitive object={duotone} />
      </EffectComposer>
    </>
  );
}
