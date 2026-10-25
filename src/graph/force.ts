export interface ForceBody {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
}

export interface ForceLink {
  a: number;
  b: number;
}

const TICKS = 180;
const ALPHA_DECAY = 0.0228;
const VELOCITY_DECAY = 0.4;
const CHARGE = -55;
const CENTER = 0.06;
const COLLIDE_GAP = 18;
const LINK_GAP = 40;
const LINK_PULL = 0.08;

export function repack(bodies: ForceBody[], links: ForceLink[]): number {
  let alpha = 1;
  for (let tick = 0; tick < TICKS; tick += 1) {
    for (const body of bodies) {
      body.vx += (0 - body.x) * CENTER * alpha;
      body.vy += (0 - body.y) * CENTER * alpha;
      body.vz += (0 - body.z) * CENTER * alpha;
    }
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        const a = bodies[i];
        const b = bodies[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dz = b.z - a.z;
        let dist = Math.hypot(dx, dy, dz) || 1e-4;
        const force = (CHARGE * alpha) / (dist * dist);
        dx /= dist;
        dy /= dist;
        dz /= dist;
        a.vx -= dx * force;
        a.vy -= dy * force;
        a.vz -= dz * force;
        b.vx += dx * force;
        b.vy += dy * force;
        b.vz += dz * force;
      }
    }
    for (const body of bodies) {
      body.vx *= 1 - VELOCITY_DECAY;
      body.vy *= 1 - VELOCITY_DECAY;
      body.vz *= 1 - VELOCITY_DECAY;
      body.x += body.vx;
      body.y += body.vy;
      body.z += body.vz;
    }
    for (let pass = 0; pass < 4; pass += 1) separate(bodies);
    pullLinks(bodies, links);
    alpha *= 1 - ALPHA_DECAY;
  }

  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const body of bodies) {
    cx += body.x;
    cy += body.y;
    cz += body.z;
  }
  cx /= bodies.length;
  cy /= bodies.length;
  cz /= bodies.length;
  let radius = 0;
  for (const body of bodies) {
    body.x -= cx;
    body.y -= cy;
    body.z -= cz;
    radius = Math.max(radius, Math.hypot(body.x, body.y, body.z) + body.r);
  }
  return radius + 16;
}

function separate(bodies: ForceBody[]) {
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i];
      const b = bodies[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dz = b.z - a.z;
      const dist = Math.hypot(dx, dy, dz) || 1e-4;
      const min = a.r + b.r + COLLIDE_GAP;
      if (dist >= min) continue;
      const push = ((min - dist) / dist) * 0.5;
      dx *= push;
      dy *= push;
      dz *= push;
      a.x -= dx;
      a.y -= dy;
      a.z -= dz;
      b.x += dx;
      b.y += dy;
      b.z += dz;
    }
  }
}

function pullLinks(bodies: ForceBody[], links: ForceLink[]) {
  for (const link of links) {
    const a = bodies[link.a];
    const b = bodies[link.b];
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const dist = Math.hypot(dx, dy, dz) || 1;
    const scale = ((dist - (a.r + b.r + LINK_GAP)) / dist) * LINK_PULL;
    a.x += dx * scale;
    a.y += dy * scale;
    a.z += dz * scale;
    b.x -= dx * scale;
    b.y -= dy * scale;
    b.z -= dz * scale;
  }
}
