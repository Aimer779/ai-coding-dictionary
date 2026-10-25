import { Color } from "three";

const fromLab = { L: 0, A: 0, B: 0 };
const toLab = { L: 0, A: 0, B: 0 };

function toOklab(color: Color, out: { L: number; A: number; B: number }) {
  const l = Math.cbrt(0.4122214708 * color.r + 0.5363325363 * color.g + 0.0514459929 * color.b);
  const m = Math.cbrt(0.2119034982 * color.r + 0.6806995451 * color.g + 0.1073969566 * color.b);
  const s = Math.cbrt(0.0883024619 * color.r + 0.2817188376 * color.g + 0.6299787005 * color.b);
  out.L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  out.A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  out.B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
}

export function mixOklab(current: Color, target: Color, amount: number) {
  toOklab(current, fromLab);
  toOklab(target, toLab);
  const l = fromLab.L + (toLab.L - fromLab.L) * amount;
  const a = fromLab.A + (toLab.A - fromLab.A) * amount;
  const b = fromLab.B + (toLab.B - fromLab.B) * amount;
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  current.r = 4.0767416621 * l_ * l_ * l_ - 3.3077115913 * m_ * m_ * m_ + 0.2309699292 * s_ * s_ * s_;
  current.g = -1.2684380046 * l_ * l_ * l_ + 2.6097574011 * m_ * m_ * m_ - 0.3413193965 * s_ * s_ * s_;
  current.b = -0.0041960863 * l_ * l_ * l_ - 0.7034186147 * m_ * m_ * m_ + 1.707614701 * s_ * s_ * s_;
}
