import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Shell } from "./chrome/Shell";
import { catalog } from "./dictionary/load";
import { layoutGraph, paintGraph } from "./graph/project";
import { Atlas } from "./scene/Atlas";
import { sectionColor } from "./scene/palette";
import { createSession, useSessionState } from "./session/store";
import { bindUrl, readUrl } from "./session/url";

const session = createSession(readUrl());

export function App() {
  const state = useSessionState(session);
  const layout = useMemo(() => layoutGraph(catalog, state.query), [state.query]);
  const frame = useMemo(
    () => paintGraph(catalog, layout, { focused: state.focused, hovered: state.hovered }),
    [layout, state.focused, state.hovered],
  );
  const tint = useMemo(() => {
    if (!state.sectionColor || !state.focused) return null;
    const term = catalog.term(state.focused);
    return term ? sectionColor(term.section) : null;
  }, [state.sectionColor, state.focused]);

  useEffect(() => bindUrl(session), []);

  return (
    <Shell catalog={catalog} session={session} frame={frame}>
      <Canvas
        camera={{ position: [320, 180, 620], fov: 50, near: 0.1, far: 4000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => session.setFocused(null)}
      >
        <Atlas
          catalog={catalog}
          frame={frame}
          tint={tint}
          framed={Boolean(state.focused)}
          onFocus={session.setFocused}
          onHover={session.setHovered}
        />
      </Canvas>
    </Shell>
  );
}
