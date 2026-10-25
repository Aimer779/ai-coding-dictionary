import { foldIntro } from "./intro";

export function unitHash(n: number) {
  const value = 43758.5453 * Math.sin(127.1 * n + 311.7);
  return value - Math.floor(value);
}

export interface Drift {
  offset: Float32Array;
  velocity: Float32Array;
  pull: Float32Array;
  stiffness: Float32Array;
  jitter: Float32Array;
  phase: Float32Array;
  frequency: Float32Array;
  amplitude: Float32Array;
  neighbors: number[][];
}

export function createDrift(count: number, neighborIndexes: number[][]): Drift {
  const drift: Drift = {
    offset: new Float32Array(count * 3),
    velocity: new Float32Array(count * 3),
    pull: new Float32Array(count),
    stiffness: new Float32Array(count),
    jitter: new Float32Array(count * 3),
    phase: new Float32Array(count * 3),
    frequency: new Float32Array(count * 3),
    amplitude: new Float32Array(count * 3),
    neighbors: neighborIndexes,
  };
  for (let index = 0; index < count; index += 1) {
    const golden = 2.39996 * index;
    drift.stiffness[index] = 42 * (0.45 + 1.4 * unitHash(index + 0.5));
    drift.pull[index] = 0.24 * (0.55 + 0.95 * unitHash(index + 4.2));
    drift.jitter[index * 3] = (unitHash(index + 21.1) - 0.5) * 8;
    drift.jitter[index * 3 + 1] = (unitHash(index + 31.7) - 0.5) * 8;
    drift.jitter[index * 3 + 2] = (unitHash(index + 41.3) - 0.5) * 8;
    for (let axis = 0; axis < 3; axis += 1) {
      const seed = index * 3 + axis;
      drift.phase[seed] = golden + Math.PI * 2 * unitHash(seed);
      drift.amplitude[seed] = 3 * (0.45 + 1.1 * unitHash(seed + 7.1));
      drift.frequency[seed] = 0.19 * (0.6 + 1.1 * unitHash(seed + 13.3));
    }
  }
  return drift;
}

export function stepDrift(drift: Drift, home: Float32Array, live: Float32Array, activeIndex: number, time: number, delta: number) {
  const dt = Math.min(Math.max(delta, 0), 0.05);
  const activeX = activeIndex >= 0 ? home[activeIndex * 3] : 0;
  const activeY = activeIndex >= 0 ? home[activeIndex * 3 + 1] : 0;
  const activeZ = activeIndex >= 0 ? home[activeIndex * 3 + 2] : 0;
  const linked = activeIndex >= 0 ? drift.neighbors[activeIndex] : undefined;
  const count = drift.pull.length;
  for (let index = 0; index < count; index += 1) {
    const homeX = home[index * 3];
    const homeY = home[index * 3 + 1];
    const homeZ = home[index * 3 + 2];
    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    if (linked?.includes(index)) {
      const weight = drift.pull[index];
      targetX = (activeX - homeX) * weight + drift.jitter[index * 3];
      targetY = (activeY - homeY) * weight + drift.jitter[index * 3 + 1];
      targetZ = (activeZ - homeZ) * weight + drift.jitter[index * 3 + 2];
    }
    const stiffness = drift.stiffness[index];
    for (let axis = 0; axis < 3; axis += 1) {
      const slot = index * 3 + axis;
      const target = axis === 0 ? targetX : axis === 1 ? targetY : targetZ;
      drift.velocity[slot] += ((target - drift.offset[slot]) * stiffness - 17 * drift.velocity[slot]) * dt;
      drift.offset[slot] += drift.velocity[slot] * dt;
      const sway =
        drift.amplitude[slot] *
        (0.7 * Math.sin(time * drift.frequency[slot] + drift.phase[slot]) +
          0.3 * Math.sin(time * drift.frequency[slot] * 2.3 + 1.7 * drift.phase[slot]));
      const homeAxis = axis === 0 ? homeX : axis === 1 ? homeY : homeZ;
      live[slot] = homeAxis + sway + drift.offset[slot];
    }
  }
  foldIntro(home, live, drift.offset, time);
}
