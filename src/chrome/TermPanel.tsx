import type { Term, TermPlace } from "../dictionary/catalog";
import { definitionBody, proseBlocks } from "../dictionary/prose";

interface TermPanelProps {
  term: Term;
  place: TermPlace;
  prevTitle: string | null;
  nextTitle: string | null;
  linkTarget: (href: string) => string | null;
  titleFor: (slug: string) => string;
  onOpen: (slug: string) => void;
  onClose: () => void;
}

export function TermPanel({
  term,
  place,
  prevTitle,
  nextTitle,
  linkTarget,
  titleFor,
  onOpen,
  onClose,
}: TermPanelProps) {
  const blocks = proseBlocks(definitionBody(term.body), linkTarget);
  return (
    <aside className="panel" aria-label={term.title}>
      <button className="icon-button panel-close" type="button" aria-label="Close term" onClick={onClose}>
        ×
      </button>
      <div className="panel-body">
        <header className="panel-meta">
          <span className="panel-section">{place.sectionTitle}</span>
          <span className="panel-index">
            <em>{String(place.index).padStart(2, "0")}</em>
            <span>/ {place.total}</span>
          </span>
        </header>
        <h2>{term.title}</h2>
        <p className="lede">{term.description}</p>
        <section>
          <span className="rule" />
          <h3>Full definition</h3>
          <div className="prose">
            {blocks.map((block, index) => (
              <p key={index}>
                {block.parts.map((part, partIndex) =>
                  part.slug ? (
                    <button key={partIndex} className="text-link" type="button" onClick={() => onOpen(part.slug as string)}>
                      {part.text}
                    </button>
                  ) : (
                    <span key={partIndex}>{part.text}</span>
                  ),
                )}
              </p>
            ))}
          </div>
        </section>
        {term.usage.length > 0 ? (
          <section>
            <span className="rule" />
            <h3>Heard in the wild</h3>
            <ul className="usage">
              {term.usage.map((line, index) => (
                <li key={line} data-role={index === term.usage.length - 1 ? "a" : "q"}>
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {term.avoid ? (
          <section>
            <span className="rule" />
            <h3>Avoid</h3>
            <p className="avoid">{term.avoid}</p>
          </section>
        ) : null}
        {term.links.length > 0 ? (
          <section>
            <span className="rule" />
            <h3>Connects to</h3>
            <div className="chips">
              {term.links.map((slug) => (
                <button key={slug} className="chip" type="button" onClick={() => onOpen(slug)}>
                  {titleFor(slug)}
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <nav className="pager" aria-label="Adjacent terms">
        <button type="button" disabled={!place.prev} onClick={() => place.prev && onOpen(place.prev)}>
          <span>Prev</span>
          <strong>{prevTitle}</strong>
        </button>
        <button type="button" disabled={!place.next} onClick={() => place.next && onOpen(place.next)}>
          <span>Next</span>
          <strong>{nextTitle}</strong>
        </button>
      </nav>
    </aside>
  );
}
