import { Fragment } from "react";

interface JapaneseRubyTextProps {
  text: string;
  className?: string;
  rtClassName?: string;
}

const RUBY_TOKEN_PATTERN = /\{\{([^{}|]+)\|\|([^{}]+)\}\}/g;

export default function JapaneseRubyText({
  text,
  className,
  rtClassName = "text-[0.62em] text-stone-500",
}: JapaneseRubyTextProps) {
  const nodes: Array<string | { surface: string; reading: string }> = [];
  let cursor = 0;

  for (const match of text.matchAll(RUBY_TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      nodes.push(text.slice(cursor, index));
    }
    nodes.push({
      surface: match[1],
      reading: match[2],
    });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return (
    <span className={className}>
      {nodes.map((node, index) => {
        if (typeof node === "string") {
          return <Fragment key={`text-${index}`}>{node}</Fragment>;
        }

        return (
          <ruby key={`ruby-${node.surface}-${index}`} className="mx-[0.04em]">
            {node.surface}
            <rt className={rtClassName}>{node.reading}</rt>
          </ruby>
        );
      })}
    </span>
  );
}
