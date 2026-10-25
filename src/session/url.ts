import type { Session } from "./store";

export function readUrl(search = window.location.search): { query: string; focused: string | null } {
  const params = new URLSearchParams(search);
  const term = params.get("term");
  return {
    query: params.get("q") ?? "",
    focused: term && term.length > 0 ? term : null,
  };
}

export function bindUrl(session: Session) {
  let writing = false;

  function write() {
    const { query, focused } = session.get();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (focused) params.set("term", focused);
    const next = params.size ? `?${params.toString()}` : window.location.pathname;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === next) return;
    writing = true;
    window.history.replaceState(null, "", next);
    writing = false;
  }

  function read() {
    if (writing) return;
    session.replace(readUrl());
  }

  const stop = session.subscribe(write);
  window.addEventListener("popstate", read);
  return () => {
    stop();
    window.removeEventListener("popstate", read);
  };
}
