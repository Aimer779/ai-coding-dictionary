import { describe, expect, it } from "vitest";
import { createDrift, stepDrift } from "./drift";

describe("hover pull", () => {
  it("springs a neighbor toward the active sphere and leaves the others at home", () => {
    const home = new Float32Array([0, 0, 0, 100, 0, 0, 0, 80, 0]);
    const live = new Float32Array(9);
    const drift = createDrift(3, [[1], [0], []]);
    for (let step = 0; step < 180; step += 1) stepDrift(drift, home, live, 0, 0, 1 / 60);
    expect(live[3]).toBeGreaterThan(0);
    expect(live[3]).toBeLessThan(100);
    expect(Math.abs(live[6])).toBeLessThan(12);
    expect(Math.hypot(live[0], live[1], live[2])).toBeLessThan(12);
  });
});
