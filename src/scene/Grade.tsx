import { useFrame } from "@react-three/fiber";
import { BlendFunction, Effect } from "postprocessing";
import { useMemo } from "react";
import { Color, Uniform } from "three";
import { mixOklab } from "./oklab";
import { NODE_INK, NODE_PAPER } from "./palette";

const fragmentShader = `
  uniform vec3 shadow;
  uniform vec3 highlight;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float l = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
    l = clamp(l / 0.86, 0.0, 1.0);
    vec3 col = mix(shadow, highlight, l);
    outputColor = vec4(col, inputColor.a);
  }
`;

class DuotoneEffect extends Effect {
  constructor() {
    super("DuotoneEffect", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["shadow", new Uniform(new Color(NODE_INK))],
        ["highlight", new Uniform(new Color(NODE_PAPER))],
      ]),
    });
  }

  get shadow() {
    return this.uniforms.get("shadow")?.value as Color;
  }

  get highlight() {
    return this.uniforms.get("highlight")?.value as Color;
  }
}

export function useGrade({ shadow, highlight }: { shadow: string; highlight: string }) {
  const duotone = useMemo(() => new DuotoneEffect(), []);
  const shadowTarget = useMemo(() => new Color(shadow), []);
  const highlightTarget = useMemo(() => new Color(highlight), []);

  useFrame((_, delta) => {
    const step = 1 - Math.exp(-delta / 0.4);
    shadowTarget.set(shadow);
    highlightTarget.set(highlight);
    mixOklab(duotone.shadow, shadowTarget, step);
    mixOklab(duotone.highlight, highlightTarget, step);
  });

  return duotone;
}
