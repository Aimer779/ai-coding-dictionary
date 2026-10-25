import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Catalog } from "../dictionary/catalog";
import { createDrift, stepDrift } from "../graph/drift";
import type { GraphFrame } from "../graph/project";
import { live } from "./live";

export function Drift({ catalog, frame }: { catalog: Catalog; frame: GraphFrame }) {
  const clock = useRef(0);
  const drift = useMemo(() => {
    const neighbors = catalog.terms.map((term) =>
      catalog.neighbors(term.slug).map((slug) => catalog.indexOf(slug)).filter((index) => index >= 0),
    );
    return createDrift(catalog.terms.length, neighbors);
  }, [catalog]);

  useFrame((_, delta) => {
    if (live.positions.length !== frame.positions.length) {
      live.positions = new Float32Array(frame.positions);
    }
    clock.current += delta;
    const active = frame.active ? catalog.indexOf(frame.active) : -1;
    if (frame.matched.length > 0) {
      live.positions.set(frame.positions);
      return;
    }
    stepDrift(drift, frame.positions, live.positions, active, clock.current, delta);
  }, -10);

  return null;
}
