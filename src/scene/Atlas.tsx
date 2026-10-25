import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { Catalog } from "../dictionary/catalog";
import { easeOutExpo, intro } from "../graph/intro";
import { overviewDistance, type GraphFrame } from "../graph/project";
import { Drift } from "./Drift";
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
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface Sweep {
  active: boolean;
  azimuth: number;
  polar: number;
  start: number;
  started: boolean;
}

export function Atlas({ catalog, frame, shadow, highlight, framed, onFocus, onHover }: AtlasProps) {
  const controls = useRef<CameraControls>(null);
  const size = useThree((state) => state.size);
  const duotone = useGrade({ shadow, highlight });
  const placed = useRef("");
  const placedOnce = useRef(false);
  const dragging = useRef(false);
  const sweep = useRef<Sweep | null>(null);
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
    const distance =
      !framed && frame.matched.length === 0 ? overviewDistance(size.width, size.height) : frame.distance;
    const key = `${frame.lookAt[0].toFixed(2)}:${frame.lookAt[1].toFixed(2)}:${frame.lookAt[2].toFixed(2)}:${distance.toFixed(1)}:${framed ? 1 : 0}`;
    if (key !== placed.current) {
      placed.current = key;
      const [x, y, z] = frame.lookAt;
      nodePoint.set(x, y, z);
      radial.copy(nodePoint);
      if (radial.lengthSq() < 1) radial.copy(HOME);
      radial.normalize().multiplyScalar(distance);
      eyePoint.copy(nodePoint).add(radial);
      const first = !placedOnce.current;
      placedOnce.current = true;
      rig.smoothTime = framed ? 0.5 : 0.28;
      void rig.setLookAt(eyePoint.x, eyePoint.y, eyePoint.z, nodePoint.x, nodePoint.y, nodePoint.z, !first);
      if (first && intro.active && !REDUCED_MOTION) {
        const azimuth = rig.azimuthAngle;
        const polar = rig.polarAngle;
        sweep.current = { active: true, azimuth, polar, start: 0, started: false };
        rig.rotateTo(azimuth - 6.6, polar + 0.6, false);
      }
    }
    const opening = sweep.current;
    if (opening?.active) {
      if (dragging.current) opening.active = false;
      else if (!intro.revealed) return;
      else {
        if (!opening.started) {
          opening.started = true;
          opening.start = performance.now();
        }
        const amount = Math.min(1, (performance.now() - opening.start) / 4200);
        const eased = easeOutExpo(amount);
        rig.rotateTo(opening.azimuth - 6.6 * (1 - eased), opening.polar + 0.6 * (1 - eased), false);
        if (amount >= 1) opening.active = false;
        return;
      }
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
      <Drift catalog={catalog} frame={frame} />
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
