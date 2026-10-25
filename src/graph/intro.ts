/** Page-load reveal shared by the title card and the graph. */
export const intro = {
  active: false,
  ready: false,
  revealed: false,
  done: true,
  revealAt: -1,
  edge: 1,
  delays: new Float32Array(0),
  scale: new Float32Array(0),
};

const readyListeners = new Set<() => void>();

export function armIntro() {
  intro.active = true;
  intro.ready = false;
  intro.revealed = false;
  intro.done = false;
  intro.revealAt = -1;
  intro.edge = 0;
  intro.delays = new Float32Array(0);
  intro.scale = new Float32Array(0);
}

export function markGraphReady() {
  if (intro.ready) return;
  intro.ready = true;
  for (const listener of readyListeners) listener();
}

export function onGraphReady(listener: () => void) {
  if (intro.ready) listener();
  else readyListeners.add(listener);
  return () => readyListeners.delete(listener);
}

export function revealIntro() {
  intro.revealed = true;
}

/** Original `tp`: exponential ease-out, 1 - 2^(-10t). */
export function easeOutExpo(amount: number) {
  return amount >= 1 ? 1 : 1 - 2 ** (-10 * amount);
}

/** Sphere birth. `delay` is distance / max distance * 0.9. Growth lasts 1.5s. */
export function introGain(elapsed: number, delay: number) {
  return easeOutExpo(Math.min(1, Math.max(0, (elapsed - delay) / 1.5)));
}

/** Lines stay out until the global 2.4s reveal passes 0.45. */
export function edgeVeil(elapsed: number) {
  const t = Math.min(1, Math.max(0, elapsed / 2.4));
  return Math.max(0, Math.min(1, (t - 0.45) / 0.55));
}

export function prepareIntro(home: Float32Array) {
  const count = home.length / 3;
  if (intro.delays.length === count) return;
  const delays = new Float32Array(count);
  let max = 1;
  for (let index = 0; index < count; index += 1) {
    const reach = Math.hypot(home[index * 3], home[index * 3 + 1], home[index * 3 + 2]);
    if (reach > max) max = reach;
  }
  for (let index = 0; index < count; index += 1) {
    delays[index] = (Math.hypot(home[index * 3], home[index * 3 + 1], home[index * 3 + 2]) / max) * 0.9;
  }
  intro.delays = delays;
  intro.scale = new Float32Array(count);
}

/** Fold a settled sample back toward the origin while the intro is running. Spring offset stays unscaled. */
export function foldIntro(home: Float32Array, live: Float32Array, offset: Float32Array, time: number) {
  if (!intro.active || intro.done) return;
  prepareIntro(home);
  if (!intro.revealed) {
    intro.edge = 0;
    intro.scale.fill(0);
    for (let index = 0; index < intro.scale.length; index += 1) {
      const slot = index * 3;
      live[slot] = 0;
      live[slot + 1] = 0;
      live[slot + 2] = 0;
    }
    return;
  }
  if (intro.revealAt < 0) intro.revealAt = time;
  const elapsed = time - intro.revealAt;
  const finished = elapsed >= 2.4;
  intro.edge = finished ? 1 : edgeVeil(elapsed);
  for (let index = 0; index < intro.scale.length; index += 1) {
    const gain = finished ? 1 : introGain(elapsed, intro.delays[index]);
    intro.scale[index] = gain;
    if (gain === 1) continue;
    const slot = index * 3;
    for (let axis = 0; axis < 3; axis += 1) {
      const sway = live[slot + axis] - home[slot + axis] - offset[slot + axis];
      live[slot + axis] = (home[slot + axis] + sway) * gain + offset[slot + axis];
    }
  }
  if (finished) intro.done = true;
}
