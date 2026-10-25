import { useEffect, useState, type ReactNode } from "react";
import type { Catalog } from "../dictionary/catalog";
import type { GraphFrame } from "../graph/project";
import type { Session } from "../session/store";
import { useSessionState } from "../session/store";
import { SearchField } from "./SearchField";
import { TermPanel } from "./TermPanel";

interface ShellProps {
  catalog: Catalog;
  session: Session;
  frame: GraphFrame;
  children: ReactNode;
}

export function Shell({ catalog, session, frame, children }: ShellProps) {
  const state = useSessionState(session);
  const [intro, setIntro] = useState(true);
  const [about, setAbout] = useState(false);
  const term = state.focused ? catalog.term(state.focused) : undefined;
  const place = state.focused ? catalog.place(state.focused) : undefined;

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") session.setFocused(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session]);

  return (
    <div className="app">
      {children}
      <SearchField query={state.query} count={frame.matched.length} onQuery={session.setQuery} />
      <div className="corner corner-info">
        <button
          className="icon-button"
          type="button"
          aria-label="About this project"
          aria-expanded={about}
          onClick={() => setAbout((open) => !open)}
        >
          i
        </button>
        {about ? (
          <div className="about" role="dialog" aria-label="About">
            <p>Matt Pocock’s AI Coding Dictionary. Plain-language terms for agentic coding, wired into a graph.</p>
            <p>
              Source: <a href="https://github.com/mattpocock/dictionary-of-ai-coding">{catalog.source}</a>
            </p>
          </div>
        ) : null}
      </div>
      <a className="credit" href="https://www.aihero.dev/s/dictionary">
        AIHero.dev
      </a>
      <div className="corner corner-tools">
        <button
          className="icon-button"
          type="button"
          aria-label={state.sectionColor ? "Use ink and paper" : "Switch to section colors"}
          aria-pressed={state.sectionColor}
          onClick={session.toggleSectionColor}
        >
          <PaletteIcon />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={state.sound ? "Mute interface sounds" : "Unmute interface sounds"}
          aria-pressed={!state.sound}
          onClick={session.toggleSound}
        >
          {state.sound ? "♪" : "×"}
        </button>
      </div>
      {term && place ? (
        <TermPanel
          term={term}
          place={place}
          prevTitle={place.prev ? catalog.term(place.prev)?.title ?? null : null}
          nextTitle={place.next ? catalog.term(place.next)?.title ?? null : null}
          linkTarget={catalog.linkTarget}
          titleFor={(slug) => catalog.term(slug)?.title ?? slug}
          onOpen={session.setFocused}
          onClose={() => session.setFocused(null)}
        />
      ) : null}
      {intro ? (
        <div className="intro" aria-hidden="true">
          <p>Matt Pocock’s</p>
          <h1>
            AI Coding
            <br />
            Dictionary
          </h1>
        </div>
      ) : null}
    </div>
  );
}

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="9" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
