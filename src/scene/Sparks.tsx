import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import type { Catalog } from "../dictionary/catalog";
import { sampleCurve } from "../graph/curve";
import type { GraphFrame } from "../graph/project";
import { live } from "./live";

function positionsOf(frame: GraphFrame) {
  return live.positions.length === frame.positions.length ? live.positions : frame.positions;
}

const POOL = 320;
const PER_EDGE = 8;

interface Spark {
  edge: number;
  t: number;
  speed: number;
  on: boolean;
}

interface SparksProps {
  catalog: Catalog;
  frame: GraphFrame;
}

export function Sparks({ catalog, frame }: SparksProps) {
  const sparks = useRef<Spark[]>(
    Array.from({ length: POOL }, () => ({ edge: 0, t: 0, speed: 0.15, on: false })),
  );
  const activeKey = useRef("");
  const geometry = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(POOL * 3), 3));
    return geometry;
  }, []);

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    const key = `${frame.active ?? ""}:${frame.controlScale}`;
    if (key !== activeKey.current) {
      activeKey.current = key;
      assign(sparks.current, catalog, frame);
    }
    const positions = geometry.getAttribute("position") as BufferAttribute;
    const array = positions.array as Float32Array;
    for (let i = 0; i < POOL; i += 1) {
      const spark = sparks.current[i];
      if (!spark.on) {
        array[i * 3 + 1] = 1e5;
        continue;
      }
      spark.t += spark.speed * step;
      if (spark.t >= 1) spark.t = 0;
      const edge = catalog.edges[spark.edge];
      const point = sampleCurve(
        pointOf(positionsOf(frame), edge.source),
        pointOf(positionsOf(frame), edge.target),
        edge.bend,
        frame.controlScale,
        spark.t,
      );
      array[i * 3] = point[0];
      array[i * 3 + 1] = point[1];
      array[i * 3 + 2] = point[2];
    }
    positions.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false} raycast={() => null}>
      <pointsMaterial color="#161615" size={0.85} sizeAttenuation transparent depthWrite={false} opacity={0.9} />
    </points>
  );
}

function assign(sparks: Spark[], catalog: Catalog, frame: GraphFrame) {
  const active = frame.active ? catalog.indexOf(frame.active) : -1;
  const edges: number[] = [];
  if (active >= 0) {
    catalog.edges.forEach((edge, index) => {
      if (edge.source !== active && edge.target !== active) return;
      if (frame.visible[edge.source] < 0.5 || frame.visible[edge.target] < 0.5) return;
      edges.push(index);
    });
  }
  const count = edges.length ? Math.min(POOL, edges.length * PER_EDGE) : 0;
  for (let i = 0; i < POOL; i += 1) {
    if (i < count) {
      sparks[i].on = true;
      sparks[i].edge = edges[i % edges.length];
      sparks[i].t = Math.random();
      sparks[i].speed = 0.1 + Math.random() * 0.1;
    } else {
      sparks[i].on = false;
    }
  }
}

function pointOf(positions: Float32Array, index: number): [number, number, number] {
  return [positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]];
}
