interface RollingLabelProps {
  text: string;
  direction?: "up" | "down";
}

export function RollingLabel({ text, direction = "up" }: RollingLabelProps) {
  return (
    <>
      <span className={direction === "down" ? "roll roll-down" : "roll"} aria-hidden="true">
        <span>{text}</span>
        <span>{text}</span>
      </span>
      <span className="sr-only">{text}</span>
    </>
  );
}
