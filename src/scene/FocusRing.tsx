import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, type Mesh, type ShaderMaterial } from "three";
import type { Catalog } from "../dictionary/catalog";
import type { GraphFrame } from "../graph/project";
import { live } from "./live";
import { NODE_ACCENT } from "./palette";

const vertexShader = `
  uniform float uSize;
  varying vec2 vUv;
  void main() {
    vUv = position.xy;
    vec4 viewPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    viewPosition.xy += position.xy * uSize * 2.0;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uRingR;
  uniform float uThick;
  varying vec2 vUv;
  void main() {
    float d = length(vUv) * 2.0;
    float band = smoothstep(uRingR - uThick, uRingR - uThick * 0.45, d)
      - smoothstep(uRingR + uThick * 0.45, uRingR + uThick, d);
    float a = clamp(band, 0.0, 1.0) * uOpacity;
    if (a < 0.002) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

export function FocusRing({ catalog, frame }: { catalog: Catalog; frame: GraphFrame }) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const shown = useRef(0);
  const arrived = useRef(0);
  const radius = useRef(2.2);
  const slug = useRef<string | null>(null);
  const uniforms = useMemo(
    () => ({
      uSize: { value: 8 },
      uColor: { value: new Color(NODE_ACCENT) },
      uOpacity: { value: 0 },
      uRingR: { value: 0.8 },
      uThick: { value: 0.05 },
    }),
    [],
  );

  useFrame((_, delta) => {
    const node = mesh.current;
    const shader = material.current;
    if (!node || !shader) return;
    const active = frame.active;
    if (active && active !== slug.current) {
      slug.current = active;
      arrived.current = 0;
      const index = catalog.indexOf(active);
      radius.current = index >= 0 ? catalog.terms[index].radius : 2.2;
    }
    const goal = active ? 0.95 : 0;
    const tau = goal > shown.current ? 0.13 : 0.05;
    shown.current += (goal - shown.current) * (1 - Math.exp(-delta / tau));
    if (shown.current < 0.003 && !active) {
      node.visible = false;
      slug.current = null;
      return;
    }
    node.visible = true;
    if (active) arrived.current += (1 - arrived.current) * (1 - 0.0009 ** delta);
    const index = active ? catalog.indexOf(active) : -1;
    if (index >= 0) {
      const positions = live.positions.length === frame.positions.length ? live.positions : frame.positions;
      node.position.set(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]);
    }
    const disc = radius.current;
    const gap = 1.1 * (0.5 + 0.35 * (1 - arrived.current));
    const size = disc + 1.35 * 1.1 + 0.17 + 1.2;
    shader.uniforms.uSize.value = size;
    shader.uniforms.uRingR.value = (disc + gap) / size;
    shader.uniforms.uThick.value = 0.17 / size;
    shader.uniforms.uOpacity.value = shown.current * (0.35 + 0.65 * arrived.current);
  });

  return (
    <mesh ref={mesh} frustumCulled={false} renderOrder={4} visible={false} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
