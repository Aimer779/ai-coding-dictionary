export const PAPER = "#eaeae8";
export const INK = "#1a1a19";
export const NODE = "#3a3936";
export const NODE_INK = "#1a1a19";
export const NODE_ACCENT = "#0a0a0a";
export const NODE_PAPER = "#f2f2f0";
export const SECTION_COLORS = ["#4500B3", "#EB4347", "#9DD395", "#D3C2FE", "#0F7A6B", "#FFD23F", "#2D3DCF"];
export const DUOTONE_SHADOW = ["#FFD79E", "#ffffff", "#000000", "#000000", "#ffffff", "#000000", "#ffffff"];

export function sectionColor(index: number): string {
  return SECTION_COLORS[index] ?? INK;
}

export function duotoneShadow(index: number): string {
  return DUOTONE_SHADOW[index] ?? NODE_INK;
}
