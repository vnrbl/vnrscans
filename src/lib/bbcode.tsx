import React, { ReactNode } from "react";

export const COMMENT_TEXT_COLORS: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
};

export function renderCommentMarkdown(text: string): ReactNode[] {
  if (!text) return [];
  return text.split("\n").flatMap((line, lineIndex, lines) => {
    const nodes = renderInlineMarkdown(line, `${lineIndex}`);
    if (lineIndex < lines.length - 1) nodes.push(<br key={`br-${lineIndex}`} />);
    return nodes;
  });
}

export function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const pattern =
    /\[color=(red|orange|yellow|green|blue|purple|pink)\]([\s\S]*?)\[\/color\]|\*\*([^*]+)\*\*|~~([^~]+)~~|`([^`]+)`|\*([^*]+)\*/gi;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));

    const key = `${keyPrefix}-${match.index}`;
    if (match[1]) {
      const color = match[1].toLowerCase();
      nodes.push(
        <span key={key} style={{ color: COMMENT_TEXT_COLORS[color] }}>
          {renderInlineMarkdown(match[2], key)}
        </span>,
      );
    } else if (match[3]) {
      nodes.push(<strong key={key}>{renderInlineMarkdown(match[3], key)}</strong>);
    } else if (match[4]) {
      nodes.push(<s key={key}>{renderInlineMarkdown(match[4], key)}</s>);
    } else if (match[5]) {
      nodes.push(
        <code key={key} className="rounded bg-secondary px-1 py-0.5 text-[0.9em]">
          {match[5]}
        </code>,
      );
    } else if (match[6]) {
      nodes.push(<em key={key}>{renderInlineMarkdown(match[6], key)}</em>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

// Helper to strip BBCode/Markdown tags for list views and previews
export function stripBbCode(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[color=[^\]]*\]([\s\S]*?)\[\/color\]/gi, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1");
}
