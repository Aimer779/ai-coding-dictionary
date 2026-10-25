import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, Mesh, Raycaster, Vector2, Vector3, type ShaderMaterial } from "three";
import type { Catalog } from "../dictionary/catalog";
import type { GraphFrame } from "../graph/project";
import { NODE_ACCENT, NODE_INK } from "./palette";
import { live } from "./live";
import { pickedSlug } from "./pointer";

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
    if (uv && uv.distanceTo(discCenter) > 0.5) intersects.splice(i, 1);
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
  const { camera, gl } = useThree();
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

  const frameRef = useRef(frame);
  frameRef.current = frame;
  const raycaster = useMemo(() => new Raycaster(), []);
  const aim = useMemo(() => new Vector2(), []);
  const center = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const element = gl.domElement;
    const pick = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      aim.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(aim, camera);
      const current = frameRef.current;
      let slug: string | null = null;
      let nearest = Infinity;
      for (let index = 0; index < catalog.terms.length; index += 1) {
        if (current.visible[index] < 0.5) continue;
        const positions = live.positions.length === current.positions.length ? live.positions : current.positions;
        center.set(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]);
        if (raycaster.ray.distanceToPoint(center) > catalog.terms[index].radius * 1.3) continue;
        const distance = center.distanceTo(camera.position);
        if (distance < nearest) {
          nearest = distance;
          slug = catalog.terms[index].slug;
        }
      }
      pickedSlug.current = slug;
      onHover(slug);
      document.documentElement.style.cursor = slug ? "pointer" : "";
    };
    const leave = () => {
      pickedSlug.current = null;
      onHover(null);
      document.documentElement.style.cursor = "";
    };
    element.addEventListener("pointermove", pick);
    element.addEventListener("pointerleave", leave);
    return () => {
      element.removeEventListener("pointermove", pick);
      element.removeEventListener("pointerleave", leave);
    };
  }, [aim, camera, catalog, center, gl, onHover, raycaster]);

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
    const positions = live.positions.length === frame.positions.length ? live.positions : frame.positions;
    node.position.set(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]);
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
    >
      <planeGeometry args={[radius * 2, radius * 2]} />
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
}
