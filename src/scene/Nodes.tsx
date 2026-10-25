import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, Mesh, Vector2, type ShaderMaterial } from "three";
import type { Catalog } from "../dictionary/catalog";
import type { GraphFrame } from "../graph/project";
import { NODE_ACCENT, NODE_INK } from "./palette";

interface NodesProps {
  catalog: Catalog;
  frame: GraphFrame;
  paper: string;
  onFocus: (slug: string) => void;
  onHover: (slug: string | null) => void;
}

const discCenter = new Vector2(0.5, 0.5);

function circleRaycast(this: Mesh, raycaster: Parameters<Mesh["raycast"]>[0], intersects: Parameters<Mesh["raycast"]>[1]) {
  const start = intersects.length;
  Mesh.prototype.raycast.call(this, raycaster, intersects);
  for (let i = intersects.length - 1; i >= start; i -= 1) {
    const uv = intersects[i].uv;
    if (!uv || uv.distanceTo(discCenter) > 0.5) intersects.splice(i, 1);
  }
}

const vertexShader = `
  varying float vDepth;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -viewPosition.z;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform vec3 uPaper;
  uniform float uState;
  uniform float uFadeNear;
  uniform float uFadeFar;
  uniform float uFadeStrength;
  uniform float uFocalDepth;
  varying float vDepth;
  varying vec2 vUv;

  void main() {
    if (length(vUv - 0.5) > 0.5) discard;
    vec3 col = uInk;
    float hot = clamp(uState - 1.0, 0.0, 1.0);
    col = mix(col, uAccent, hot);

    float sep = clamp((vDepth - (uFocalDepth - 160.0)) / 200.0, 0.0, 1.0);
    col = mix(col, uPaper, sep * 0.220);

    float depthFade = 1.0 - smoothstep(uFadeNear, uFadeFar, vDepth) * uFadeStrength;
    float dim = clamp(uState, 0.0, 1.0);
    float fade = depthFade * mix(0.2, 1.0, dim);
    col = mix(uPaper, col, fade);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Nodes({ catalog, frame, paper, onFocus, onHover }: NodesProps) {
  const shown = useRef(Float32Array.from(frame.visible));
  const state = useRef(Float32Array.from(frame.nodeState));
  const { camera } = useThree();
  const fade = useMemo(
    () => ({
      uInk: { value: new Color(NODE_INK) },
      uAccent: { value: new Color(NODE_ACCENT) },
      uPaper: { value: new Color(paper) },
      uFadeNear: { value: 300 },
      uFadeFar: { value: 560 },
      uFadeStrength: { value: 0.82 },
      uFocalDepth: { value: 600 },
    }),
    [],
  );

  useEffect(() => {
    fade.uPaper.value.set(paper);
  }, [fade, paper]);

  useFrame(() => {
    const depth = camera.position.length();
    fade.uFadeNear.value = depth - 35;
    fade.uFadeFar.value = depth + 200;
    fade.uFocalDepth.value = depth;
  });

  return (
    <group>
      {catalog.terms.map((term, index) => (
        <NodeMesh
          key={term.slug}
          index={index}
          radius={term.radius}
          frame={frame}
          shown={shown.current}
          tone={state.current}
          fade={fade}
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
  tone,
  fade,
  onFocus,
  onHover,
}: {
  index: number;
  radius: number;
  frame: GraphFrame;
  shown: Float32Array;
  tone: Float32Array;
  fade: {
    uInk: { value: Color };
    uAccent: { value: Color };
    uPaper: { value: Color };
    uFadeNear: { value: number };
    uFadeFar: { value: number };
    uFadeStrength: { value: number };
    uFocalDepth: { value: number };
  };
  onFocus: () => void;
  onHover: (over: boolean) => void;
}) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ ...fade, uState: { value: 1 } }), [fade]);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const node = mesh.current;
    if (!node) return;
    node.quaternion.copy(camera.quaternion);
    const target = frame.visible[index];
    const current = shown[index];
    shown[index] = current + (target - current) * (target > current ? 0.22 : 0.08);
    const nextState = frame.nodeState[index];
    const eased = tone[index] + (nextState - tone[index]) * (1 - (nextState > tone[index] ? 0.16 : 0.012) ** delta);
    tone[index] = eased;
    if (material.current) material.current.uniforms.uState.value = eased;
    node.position.set(frame.positions[index * 3], frame.positions[index * 3 + 1], frame.positions[index * 3 + 2]);
    const presence = shown[index];
    node.visible = presence > 0.05;
    node.scale.setScalar(Math.max(presence, 0.001));
  });

  return (
    <mesh
      ref={mesh}
      raycast={circleRaycast}
      onClick={(event) => {
        event.stopPropagation();
        onFocus();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.documentElement.style.cursor = "pointer";
        onHover(true);
      }}
      onPointerOut={() => {
        document.documentElement.style.cursor = "";
        onHover(false);
      }}
    >
      <planeGeometry args={[radius * 2, radius * 2]} />
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
}
