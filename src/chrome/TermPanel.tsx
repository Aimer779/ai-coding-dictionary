import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

function step(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}
import type { Term, TermPlace } from "../dictionary/catalog";
import { definitionBody, parseInline, parseMarkdown, type Block, type Inline } from "../dictionary/prose";
import { RollingLabel } from "./RollingLabel";

interface TermPanelProps {
  open: boolean;
  term: Term;
  place: TermPlace;
  linkTarget: (href: string) => string | null;
  titleFor: (slug: string) => string;
  onOpen: (slug: string) => void;
  onClose: () => void;
  placeFor: (slug: string) => TermPlace | undefined;
}

export function TermPanel({
  open,
  term,
  place,
  linkTarget,
  titleFor,
  onOpen,
  onClose,
  placeFor,
}: TermPanelProps) {
  const { exit, motion } = usePanelMotion(term, place.index);
  return (
    <aside className="panel" data-open={open} aria-label={term.title}>
      <button className="panel-close" type="button" aria-label="Close" onClick={onClose}>
        <span className="panel-close-mark" />
      </button>
      <div className="panel-stage">
      {exit && placeFor(exit.term.slug) ? (
        <div className="panel-slide" data-phase="exit" data-mode="browse" style={dirStyle(exit.dir)}>
          <PanelDocument
            term={exit.term}
            place={placeFor(exit.term.slug) as TermPlace}
            linkTarget={linkTarget}
            titleFor={titleFor}
            onOpen={onOpen}
          />
        </div>
      ) : null}
      <div key={term.slug} className="panel-slide" data-phase="enter" data-mode={motion.mode} style={dirStyle(motion.dir)}>
      <PanelDocument
        term={term}
        place={place}
        linkTarget={linkTarget}
        titleFor={titleFor}
        onOpen={onOpen}
      />
      </div>
      </div>
    </aside>
  );
}

function usePanelMotion(term: Term, index: number) {
  const current = useRef<{ term: Term; index: number } | null>(null);
  const [exit, setExit] = useState<{ term: Term; dir: number } | null>(null);
  const [motion, setMotion] = useState<{ dir: number; mode: "open" | "browse" }>({ dir: 0, mode: "open" });

  useEffect(() => {
    const previous = current.current;
    if (previous?.term.slug === term.slug) return;
    const dir = previous ? (index >= previous.index ? 1 : -1) : 0;
    const mode = previous ? "browse" : "open";
    let timer = 0;
    if (previous) {
      setExit({ term: previous.term, dir });
      timer = window.setTimeout(() => setExit(null), 560);
    }
    current.current = { term, index };
    setMotion({ dir, mode });
    return () => window.clearTimeout(timer);
  }, [term, index]);

  return { exit, motion };
}

function dirStyle(dir: number): CSSProperties {
  return { "--dir": dir } as CSSProperties;
}

function PanelDocument({
  term,
  place,
  linkTarget,
  titleFor,
  onOpen,
}: {
  term: Term;
  place: TermPlace;
  linkTarget: (href: string) => string | null;
  titleFor: (slug: string) => string;
  onOpen: (slug: string) => void;
}) {
  const blocks = parseMarkdown(definitionBody(term.body), linkTarget);
  const prevTitle = place.prev ? titleFor(place.prev) : null;
  const nextTitle = place.next ? titleFor(place.next) : null;
  return (
    <>
      <PanelScroll>
        <header className="panel-meta reveal" style={step(0)}>
          <span className="panel-section">{place.sectionTitle}</span>
          <span className="panel-index">
            <em>{String(place.index).padStart(2, "0")}</em>
            <span>/ {String(place.total).padStart(2, "0")}</span>
          </span>
        </header>
        <span className="rule" style={step(1)} />
        <h2><span className="panel-title">{term.title}</span></h2>
        <p className="lede reveal" style={step(2)}>{term.description}</p>
        <section className="reveal" style={step(3)}>
          <span className="rule" style={step(3)} />
          <h3>Full definition</h3>
          <Definition key={term.slug} blocks={blocks} onOpen={onOpen} />
        </section>
        {term.usage.length > 0 ? (
          <section className="reveal" style={step(4)}>
            <span className="rule" style={step(4)} />
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
          <section className="reveal" style={step(5)}>
            <span className="rule" style={step(5)} />
            <h3>Avoid</h3>
            <p className="avoid">
              <Inlines parts={parseInline(term.avoid, linkTarget)} onOpen={onOpen} />
            </p>
          </section>
        ) : null}
        {term.links.length > 0 ? (
          <section className="reveal" style={step(6)}>
            <span className="rule" style={step(6)} />
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
        <div className="entry-actions reveal" style={step(7)}>
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
      </PanelScroll>
      <nav className="pager reveal" style={step(2)} aria-label="Adjacent terms">
        <PagerButton dir="prev" label="Prev" title={prevTitle} disabled={!place.prev} onClick={() => place.prev && onOpen(place.prev)} />
        <PagerButton dir="next" label="Next" title={nextTitle} disabled={!place.next} onClick={() => place.next && onOpen(place.next)} />
      </nav>
    </>
  );
}

function PanelScroll({ children }: { children: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ height: 0, top: 0, visible: false });

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const measure = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const visible = scrollHeight > clientHeight + 1;
      const height = visible ? Math.max(36, (clientHeight / scrollHeight) * clientHeight) : 0;
      const travel = Math.max(1, clientHeight - height);
      const top = visible ? (scrollTop / (scrollHeight - clientHeight)) * travel : 0;
      setThumb({ height, top, visible });
    };
    measure();
    element.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const content = element.firstElementChild;
    if (content) observer.observe(content);
    return () => {
      element.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

  function drag(event: ReactPointerEvent<HTMLSpanElement>) {
    const element = scroller.current;
    if (!element) return;
    const startY = event.clientY;
    const startScroll = element.scrollTop;
    const travel = Math.max(1, element.clientHeight - thumb.height);
    const range = element.scrollHeight - element.clientHeight;
    const move = (pointer: PointerEvent) => {
      element.scrollTop = startScroll + ((pointer.clientY - startY) / travel) * range;
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  return (
    <div className="panel-scroll">
      <div className="panel-body" ref={scroller}>
        <div>{children}</div>
      </div>
      {thumb.visible ? (
        <span
          className="panel-thumb"
          style={{ height: thumb.height, transform: `translateY(${thumb.top}px)` }}
          onPointerDown={drag}
        />
      ) : null}
    </div>
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
