"use client";
import { useEffect, useState } from "react";

/**
 * Reveals text character-by-character. Used for the narration so it
 * feels generated rather than pre-rendered, mirroring search-engine's
 * streaming AI Overview vibe.
 */
type Props = {
  text: string;
  speedMs?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function TypewriterText({ text, speedMs = 14, className, style }: Props) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
      }
    }, speedMs);
    return () => clearInterval(id);
  }, [text, speedMs]);

  const done = shown.length >= text.length;

  return (
    <span className={className} style={style}>
      {shown}
      {!done && (
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 6,
            height: 14,
            verticalAlign: "-2px",
            marginLeft: 2,
            background: "var(--text)",
            animation: "ticker-pulse 0.8s ease-in-out infinite",
          }}
        />
      )}
    </span>
  );
}
