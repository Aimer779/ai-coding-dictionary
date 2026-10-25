import { useEffect, useState, type ReactNode } from "react";
import type { Catalog } from "../dictionary/catalog";
import type { GraphFrame } from "../graph/project";
import type { Session } from "../session/store";
import { useSessionState } from "../session/store";
import { Intro } from "./Intro";
import { SearchField } from "./SearchField";
import { TermPanel } from "./TermPanel";
import { Tip } from "./Tip";

interface ShellProps {
  catalog: Catalog;
  session: Session;
  frame: GraphFrame;
  children: ReactNode;
}

export function Shell({ catalog, session, frame, children }: ShellProps) {
  const state = useSessionState(session);
  const [about, setAbout] = useState(false);
  const term = state.focused ? catalog.term(state.focused) : undefined;
  const [panelTerm, setPanelTerm] = useState(term);
  const [panelOpen, setPanelOpen] = useState(Boolean(term));
  const [stageOpen, setStageOpen] = useState(Boolean(term));
  const place = panelTerm ? catalog.place(panelTerm.slug) : undefined;

  useEffect(() => {
    if (term) {
      setPanelTerm(term);
      setPanelOpen(true);
      setStageOpen(true);
      return;
    }
    setPanelOpen(false);
    setStageOpen(false);
    const clear = window.setTimeout(() => setPanelTerm(undefined), 640);
    return () => window.clearTimeout(clear);
  }, [term]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") session.setFocused(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session]);

  return (
    <div className="app" data-open={stageOpen ? "true" : "false"}>
      <div className="stage">{children}</div>
      <SearchField query={state.query} count={frame.matched.length} onQuery={session.setQuery} />
      <div className="corner corner-info">
        <Tip content="About" side="bottom">
          <button
            className="icon-button"
            type="button"
            aria-label="About this project"
            aria-expanded={about}
            onClick={() => setAbout((open) => !open)}
          >
            i
          </button>
        </Tip>
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
        <span className="credit-ai">AI</span>Hero.dev
      </a>
      <div className="corner corner-tools">
        <Tip content={state.sectionColor ? "Colors off" : "Colors on"}>
          <button
            className="icon-button"
            type="button"
            aria-label={state.sectionColor ? "Switch to grayscale" : "Switch to section colors"}
            aria-pressed={state.sectionColor}
            onClick={session.toggleSectionColor}
          >
            <PaletteIcon />
          </button>
        </Tip>
        <Tip content={state.sound ? "Mute" : "Unmute"}>
          <button
            className="icon-button"
            type="button"
            aria-label={state.sound ? "Mute interface sounds" : "Unmute interface sounds"}
            aria-pressed={!state.sound}
            onClick={session.toggleSound}
          >
            <SoundIcon muted={!state.sound} />
          </button>
        </Tip>
      </div>
      {panelTerm && place ? (
        <TermPanel
          open={panelOpen}
          term={panelTerm}
          place={place}
          linkTarget={catalog.linkTarget}
          titleFor={(slug) => catalog.term(slug)?.title ?? slug}
          onOpen={session.setFocused}
          onClose={() => session.setFocused(null)}
          placeFor={(slug) => catalog.place(slug)}
        />
      ) : null}
      <Intro />
    </div>
  );
}

function PaletteIcon() {
  return (
    <svg className="tool-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.66H16c3.05 0 5.55-2.5 5.55-5.56C21.55 6 17.46 2 12 2z" />
      <circle cx="8.5" cy="7.5" r="1.1" />
      <circle cx="6.5" cy="12.5" r="1.1" />
      <circle cx="13.5" cy="6.5" r="1.1" />
      <circle cx="17.5" cy="10.5" r="1.1" />
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg className="tool-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      {muted ? (
        <path d="m16 9 5 6m0-6-5 6" />
      ) : (
        <>
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 6a8 8 0 0 1 0 12" />
        </>
      )}
    </svg>
  );
}
