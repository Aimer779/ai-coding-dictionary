import { useEffect, useRef, useState, type CSSProperties } from "react";
import { armIntro, onGraphReady, revealIntro } from "../graph/intro";

const WORDS = ["AI", "Coding", "Dictionary"];

/** Title card. The graph stays collapsed until this bar finishes. */
export function Intro() {
  const armed = useRef(false);
  if (!armed.current) {
    armed.current = true;
    armIntro();
  }
  const [hiding, setHiding] = useState(false);
  const [gone, setGone] = useState(false);
  const fill = useRef<HTMLSpanElement>(null);
  const progress = useRef(0);
  const finishing = useRef(false);
  const mountedAt = useRef(0);
  if (mountedAt.current === 0) mountedAt.current = performance.now();

  useEffect(() => {
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = finishing.current ? 1 : 0.9;
      const rate = finishing.current ? 7 : 0.5;
      progress.current += (target - progress.current) * (1 - Math.exp(-rate * dt));
      if (fill.current) fill.current.style.width = `${(100 * progress.current).toFixed(2)}%`;
      if (finishing.current && progress.current > 0.995) {
        if (fill.current) fill.current.style.width = "100%";
        setHiding(true);
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    const fallback = window.setTimeout(() => {
      finishing.current = true;
    }, 12000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    let timer = 0;
    const stop = onGraphReady(() => {
      const wait = Math.max(0, 1000 - (performance.now() - mountedAt.current));
      timer = window.setTimeout(() => {
        finishing.current = true;
      }, wait);
    });
    return () => {
      stop();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!hiding) return;
    revealIntro();
    const timer = window.setTimeout(() => setGone(true), 600);
    return () => window.clearTimeout(timer);
  }, [hiding]);

  if (gone) return null;

  return (
    <div className="intro" data-hiding={hiding ? "true" : "false"} aria-hidden={hiding}>
      <p className="intro-credit">Matt Pocock’s</p>
      <h1 className="intro-title" aria-label="Matt Pocock's AI Coding Dictionary">
        {WORDS.map((word, index) => (
          <span className="intro-word" key={word} aria-hidden="true">
            <span className="intro-word-inner" style={{ "--i": index } as CSSProperties}>
              {word}
            </span>
          </span>
        ))}
      </h1>
      <div className="intro-bar" aria-hidden="true">
        <span ref={fill} className="intro-fill" />
      </div>
    </div>
  );
}
