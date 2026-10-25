import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Color, ShaderMaterial } from "three";
import type { Catalog } from "../dictionary/catalog";
import { sampleCurve } from "../graph/curve";
import type { GraphFrame } from "../graph/project";
import { live } from "./live";
import { INK } from "./palette";

const SEGMENTS = 16;

const VERTEX = `
  attribute float aBright;
  varying float vBright;
  void main() {
    vBright = aBright;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = `
  precision highp float;
  varying float vBright;
  uniform vec3 uColor;
  void main() {
    float fade = vBright * vBright;
    gl_FragColor = vec4(uColor, fade);
  }
`;

interface EdgesProps {
  catalog: Catalog;
  frame: GraphFrame;
}

export function Edges({ catalog, frame }: EdgesProps) {
  const material = useRef<ShaderMaterial>(null);
  const shown = useRef(new Float32Array(catalog.edges.length));
  const color = useMemo(() => new Color(INK), []);
  const geometry = useMemo(() => buildGeometry(catalog.edges.length), [catalog.edges.length]);

  useFrame(() => {
    const position = geometry.getAttribute("position") as BufferAttribute;
    const bright = geometry.getAttribute("aBright") as BufferAttribute;
    const array = position.array as Float32Array;
    const colors = bright.array as Float32Array;
    let dirtyPosition = false;
    for (let edgeIndex = 0; edgeIndex < catalog.edges.length; edgeIndex += 1) {
      const edge = catalog.edges[edgeIndex];
      const target = frame.edgeBright[edgeIndex];
      const current = shown.current[edgeIndex];
      const next = current + (target - current) * (target > current ? 0.2 : 0.06);
      shown.current[edgeIndex] = next;
      const positions = live.positions.length === frame.positions.length ? live.positions : frame.positions;
      const a: [number, number, number] = [
        positions[edge.source * 3],
        positions[edge.source * 3 + 1],
        positions[edge.source * 3 + 2],
      ];
      const b: [number, number, number] = [
        positions[edge.target * 3],
        positions[edge.target * 3 + 1],
        positions[edge.target * 3 + 2],
      ];
      for (let step = 0; step < SEGMENTS; step += 1) {
        const p0 = sampleCurve(a, b, edge.bend, frame.controlScale, step / SEGMENTS);
        const p1 = sampleCurve(a, b, edge.bend, frame.controlScale, (step + 1) / SEGMENTS);
        const offset = (edgeIndex * SEGMENTS + step) * 6;
        if (
          array[offset] !== p0[0] ||
          array[offset + 3] !== p1[0]
        ) {
          array[offset] = p0[0];
          array[offset + 1] = p0[1];
          array[offset + 2] = p0[2];
          array[offset + 3] = p1[0];
          array[offset + 4] = p1[1];
          array[offset + 5] = p1[2];
          dirtyPosition = true;
        }
        colors[offset / 3] = next;
        colors[offset / 3 + 1] = next;
      }
    }
    if (dirtyPosition) position.needsUpdate = true;
    bright.needsUpdate = true;
    if (material.current) material.current.uniforms.uColor.value = color;
  });

  return (
    <lineSegments geometry={geometry} frustumCulled={false} raycast={() => null}>
      <shaderMaterial
        ref={material}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        transparent
        depthWrite={false}
        uniforms={{ uColor: { value: color } }}
      />
    </lineSegments>
  );
}

function buildGeometry(edgeCount: number) {
  const geometry = new BufferGeometry();
  const vertices = edgeCount * SEGMENTS * 2;
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(vertices * 3), 3));
  geometry.setAttribute("aBright", new BufferAttribute(new Float32Array(vertices), 1));
  return geometry;
}
