import { useState } from "react";
import type { Term, TermPlace } from "../dictionary/catalog";
import { definitionBody, parseInline, parseMarkdown, type Block, type Inline } from "../dictionary/prose";
import { RollingLabel } from "./RollingLabel";

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
  const blocks = parseMarkdown(definitionBody(term.body), linkTarget);
  return (
    <aside className="panel" aria-label={term.title}>
      <button className="panel-close" type="button" aria-label="Close" onClick={onClose}>
        <span className="panel-close-mark" />
      </button>
      <div className="panel-body">
        <header className="panel-meta">
          <span className="panel-section">{place.sectionTitle}</span>
          <span className="panel-index">
            <em>{String(place.index).padStart(2, "0")}</em>
            <span>/ {place.total}</span>
          </span>
        </header>
        <span className="rule" />
        <h2>{term.title}</h2>
        <p className="lede">{term.description}</p>
        <section>
          <span className="rule" />
          <h3>Full definition</h3>
          <Definition key={term.slug} blocks={blocks} onOpen={onOpen} />
        </section>
        {term.usage.length > 0 ? (
          <section>
            <span className="rule" />
            <h3>Heard in the wild</h3>
            <ul className="usage">
              {term.usage.map((line, index) => (
                <li key={line} data-role={index === term.usage.length - 1 ? "a" : "q"}>
                  <Inlines parts={parseInline(line, linkTarget)} onOpen={onOpen} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {term.avoid ? (
          <section>
            <span className="rule" />
            <h3>Avoid</h3>
            <p className="avoid">
              <Inlines parts={parseInline(term.avoid, linkTarget)} onOpen={onOpen} />
            </p>
          </section>
        ) : null}
        {term.links.length > 0 ? (
          <section>
            <span className="rule" />
            <h3>Connects to</h3>
            <div className="chips">
              {term.links.map((slug) => (
                <button key={slug} className="chip" type="button" onClick={() => onOpen(slug)}>
                  <RollingLabel text={titleFor(slug)} />
                </button>
              ))}
            </div>
          </section>
        ) : null}
        <span className="rule entry-rule" />
        <div className="entry-actions">
          <a className="entry-cta" href={entryHref(term.slug)} target="_blank" rel="noopener noreferrer">
            <RollingLabel text="Read full entry" />
            <ExternalIcon />
          </a>
          <button className="entry-share" type="button" onClick={() => shareTerm(term)}>
            <RollingLabel text="Share" />
            <ShareIcon />
          </button>
          <button className="entry-share" type="button" onClick={() => copyTerm(term)}>
            <RollingLabel text="Copy markdown" />
            <CopyIcon />
          </button>
        </div>
      </div>
      <nav className="pager" aria-label="Adjacent terms">
        <PagerButton dir="prev" label="Prev" title={prevTitle} disabled={!place.prev} onClick={() => place.prev && onOpen(place.prev)} />
        <PagerButton dir="next" label="Next" title={nextTitle} disabled={!place.next} onClick={() => place.next && onOpen(place.next)} />
      </nav>
    </aside>
  );
}

function Definition({ blocks, onOpen }: { blocks: Block[]; onOpen: (slug: string) => void }) {
  const [open, setOpen] = useState(false);
  const collapsed = blocks.length > 1 && !open;
  const shown = collapsed ? blocks.slice(0, 1) : blocks;
  return (
    <div className="prose">
      {shown.map((block, index) => (
        <ProseBlock key={index} block={block} onOpen={onOpen} />
      ))}
      {blocks.length > 1 ? (
        <button
          className="read-more"
          type="button"
          data-open={open}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Show less" : "Read more"}
          <svg className="read-more-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

function ProseBlock({ block, onOpen }: { block: Block; onOpen: (slug: string) => void }) {
  if (block.type === "p") {
    return (
      <p>
        <Inlines parts={block.inlines} onOpen={onOpen} />
      </p>
    );
  }
  if (block.type === "ul") {
    return (
      <ul>
        {block.items.map((item, index) => (
          <li key={index}>
            <Inlines parts={item} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {block.headers.map((cell, index) => (
              <th key={index}>
                <Inlines parts={cell} onOpen={onOpen} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>
                  <Inlines parts={cell} onOpen={onOpen} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Inlines({ parts, onOpen }: { parts: Inline[]; onOpen: (slug: string) => void }) {
  return parts.map((part, index) => {
    if (part.type === "em") return <em key={index}>{part.text}</em>;
    if (part.type === "strong") return <strong key={index}>{part.text}</strong>;
    if (part.type === "code") return <code key={index}>{part.text}</code>;
    if (part.type === "link" && part.slug) {
      return (
        <button key={index} className="text-link" type="button" onClick={() => onOpen(part.slug as string)}>
          {part.text}
        </button>
      );
    }
    return <span key={index}>{part.text}</span>;
  });
}

function PagerButton({
  dir,
  label,
  title,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  label: string;
  title: string | null;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button className="pager-btn" type="button" data-dir={dir} disabled={disabled} onClick={onClick}>
      {dir === "prev" ? <PagerArrow dir={dir} /> : null}
      <span className="pager-meta">
        <span className="pager-kicker">{label}</span>
        <span className="pager-name">{title ? <RollingLabel text={title} direction={dir === "prev" ? "down" : "up"} /> : null}</span>
      </span>
      {dir === "next" ? <PagerArrow dir={dir} /> : null}
    </button>
  );
}

function entryHref(slug: string) {
  return `https://www.aihero.dev/ai-coding-dictionary/${slug}`;
}

async function shareTerm(term: Term) {
  const url = `https://www.aicodingdictionary.com/?term=${term.slug}`;
  const payload = { title: term.title, url };
  if (navigator.share) {
    try {
      await navigator.share(payload);
      return;
    } catch {
      return;
    }
  }
  await navigator.clipboard.writeText(url);
}

async function copyTerm(term: Term) {
  const markdown = [`# ${term.title}`, "", term.description, "", term.body].join("\n");
  await navigator.clipboard.writeText(markdown);
}

function ExternalIcon() {
  return (
    <svg className="entry-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5h5v5" />
      <path d="M19 5l-8.5 8.5" />
      <path d="M19 13.5V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V6.5A1.5 1.5 0 0 1 6 5h4.5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="entry-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 12v6a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18v-6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="entry-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="1.6" />
      <path d="M6 15H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h8.5A1.5 1.5 0 0 1 15 5v1" />
    </svg>
  );
}

function PagerArrow({ dir }: { dir: "prev" | "next" }) {
  const path = dir === "prev" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7";
  return (
    <span className="pager-arrow" aria-hidden="true">
      <span className="pager-arrow-reveal">
        <span className="pager-arrow-cell">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={path} />
          </svg>
        </span>
        <span className="pager-arrow-cell">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={path} />
          </svg>
        </span>
      </span>
    </span>
  );
}
