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
      <header className="panel-top">
        <p>{place.sectionTitle}</p>
        <p>
          {String(place.index).padStart(2, "0")} / {place.total}
        </p>
        <button className="icon-button panel-close" type="button" aria-label="Close term" onClick={onClose}>
          ×
        </button>
      </header>
      <h2>{term.title}</h2>
      <p className="lede">{term.description}</p>
      <section>
        <h3>Full definition</h3>
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
      </section>
      {term.usage.length > 0 ? (
        <section>
          <h3>Heard in the wild</h3>
          {term.usage.map((line, index) => (
            <p key={line} className={index === term.usage.length - 1 ? "quote is-answer" : "quote"}>
              {line}
            </p>
          ))}
        </section>
      ) : null}
      {term.avoid ? (
        <section>
          <h3>Avoid</h3>
          <p>{term.avoid}</p>
        </section>
      ) : null}
      {term.links.length > 0 ? (
        <section>
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
      <footer className="pager">
        <button type="button" disabled={!place.prev} onClick={() => place.prev && onOpen(place.prev)}>
          <span>Prev</span>
          {prevTitle}
        </button>
        <button type="button" disabled={!place.next} onClick={() => place.next && onOpen(place.next)}>
          <span>Next</span>
          {nextTitle}
        </button>
      </footer>
    </aside>
  );
}
