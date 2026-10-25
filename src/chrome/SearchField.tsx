import { useEffect, useRef } from "react";
import { Tip } from "./Tip";

interface SearchFieldProps {
  query: string;
  count: number;
  onQuery: (query: string) => void;
}

export function SearchField({ query, count, onQuery }: SearchFieldProps) {
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) input.current?.blur();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="search-root" ref={root}>
      <div className="search">
        <Tip content="Search" side="bottom">
          <button
            className="search-icon"
            type="button"
            aria-label="Search the dictionary"
            onClick={() => input.current?.focus()}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.34-4.34" />
            </svg>
          </button>
        </Tip>
        <input
          ref={input}
          value={query}
          aria-label="Search the dictionary"
          placeholder="Search the dictionary"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            if (query.trim()) onQuery("");
            else input.current?.blur();
          }}
        />
      </div>
      {query ? <p className="search-count">{count} TERMS</p> : null}
    </div>
  );
}
