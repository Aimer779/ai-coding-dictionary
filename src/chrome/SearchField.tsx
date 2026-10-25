import { useEffect, useRef, useState } from "react";

interface SearchFieldProps {
  query: string;
  count: number;
  onQuery: (query: string) => void;
}

export function SearchField({ query, count, onQuery }: SearchFieldProps) {
  const [open, setOpen] = useState(query.length > 0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  return (
    <div className={open ? "search is-open" : "search"}>
      <button className="icon-button" type="button" aria-label="Search the dictionary" onClick={() => setOpen(true)}>
        <SearchIcon />
      </button>
      {open ? (
        <input
          ref={input}
          value={query}
          aria-label="Search the dictionary"
          placeholder="Search the dictionary"
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onQuery("");
              setOpen(false);
            }
          }}
        />
      ) : null}
      {open ? (
        <button
          className="search-clear"
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onQuery("");
            setOpen(false);
          }}
        >
          ×
        </button>
      ) : null}
      {open && query ? <p className="search-count">{count} TERMS</p> : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16.5L20 20.5" />
    </svg>
  );
}
