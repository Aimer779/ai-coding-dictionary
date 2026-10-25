import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TipProps {
  content: string;
  side?: "top" | "bottom";
  children: ReactNode;
}

type Phase = "closed" | "start" | "open" | "end";

export function Tip({ content, side = "top", children }: TipProps) {
  const trigger = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>("closed");
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  const frame = useRef(0);
  const timer = useRef(0);
  const generation = useRef(0);

  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
    window.clearTimeout(timer.current);
  }, []);

  function place() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    setAnchor({
      x: rect.left + rect.width / 2,
      y: side === "bottom" ? rect.bottom + 10 : rect.top - 10,
    });
  }

  function show() {
    const id = ++generation.current;
    window.clearTimeout(timer.current);
    place();
    setPhase("start");
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        if (generation.current === id) setPhase("open");
      });
    });
  }

  function hide() {
    const id = ++generation.current;
    cancelAnimationFrame(frame.current);
    setPhase((current) => (current === "closed" ? current : "end"));
    timer.current = window.setTimeout(() => {
      if (generation.current === id) setPhase("closed");
    }, 150);
  }

  return (
    <span
      ref={trigger}
      className="tip-trigger"
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {children}
      {phase !== "closed"
        ? createPortal(
            <span className="tip-positioner" data-side={side} style={{ left: anchor.x, top: anchor.y }}>
              <span role="tooltip" className={phase === "open" ? "tip" : "tip is-hidden"}>
                {content}
              </span>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
