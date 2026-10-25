import type { Vec3 } from "../dictionary/types";

export function sampleCurve(a: Vec3, b: Vec3, bend: Vec3, scale: number, t: number): Vec3 {
  const midX = (a[0] + b[0]) / 2;
  const midY = (a[1] + b[1]) / 2;
  const midZ = (a[2] + b[2]) / 2;
  const cx = midX + bend[0] * scale;
  const cy = midY + bend[1] * scale;
  const cz = midZ + bend[2] * scale;
  const u = 1 - t;
  return [
    u * u * a[0] + 2 * u * t * cx + t * t * b[0],
    u * u * a[1] + 2 * u * t * cy + t * t * b[1],
    u * u * a[2] + 2 * u * t * cz + t * t * b[2],
  ];
}
