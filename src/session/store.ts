import { useSyncExternalStore } from "react";

export interface SessionState {
  query: string;
  focused: string | null;
  hovered: string | null;
  sectionColor: boolean;
  sound: boolean;
}

export interface Session {
  get(): SessionState;
  subscribe(listener: () => void): () => void;
  setQuery(query: string): void;
  setFocused(slug: string | null): void;
  setHovered(slug: string | null): void;
  toggleSectionColor(): void;
  toggleSound(): void;
  replace(next: Pick<SessionState, "query" | "focused">): void;
}

export function createSession(initial: Pick<SessionState, "query" | "focused">): Session {
  let state: SessionState = {
    query: initial.query,
    focused: initial.focused,
    hovered: null,
    sectionColor: false,
    sound: true,
  };
  const listeners = new Set<() => void>();

  function emit(next: SessionState) {
    state = next;
    listeners.forEach((listener) => listener());
  }

  return {
    get: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setQuery(query) {
      emit({ ...state, query, focused: query ? null : state.focused, hovered: null });
    },
    setFocused(slug) {
      emit({ ...state, focused: slug, hovered: null });
    },
    setHovered(slug) {
      if (state.hovered === slug) return;
      emit({ ...state, hovered: slug });
    },
    toggleSectionColor() {
      emit({ ...state, sectionColor: !state.sectionColor });
    },
    toggleSound() {
      emit({ ...state, sound: !state.sound });
    },
    replace(next) {
      if (state.query === next.query && state.focused === next.focused) return;
      emit({ ...state, query: next.query, focused: next.focused, hovered: null });
    },
  };
}

export function useSessionState(session: Session): SessionState {
  return useSyncExternalStore(session.subscribe, session.get, session.get);
}
