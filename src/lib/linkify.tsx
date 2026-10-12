import type { ReactNode } from "react";

const LINK_RE = /(https?:\/\/[^\s]+|[\w.+-]+@[\w-]+\.[\w.]+)/g;

// Splits output text into plain strings and <a> tags for URLs and emails.
export function linkify(text: string): ReactNode[] {
  // The capture group keeps matches in the result, at the odd indexes.
  return text.split(LINK_RE).map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        className="tp-link"
        href={part.startsWith("http") ? part : `mailto:${part}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}
