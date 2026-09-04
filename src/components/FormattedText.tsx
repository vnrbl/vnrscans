"use client";

import React, { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { isSafeUrl } from "@/lib/safe-url";

interface FormattedTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
}

type InlineToken =
  | { type: "text"; content: string }
  | { type: "link"; label: string; url: string }
  | { type: "bold"; content: string }
  | { type: "italic"; content: string }
  | { type: "code"; content: string };

// Matches:
// 1) Markdown link: [label](url)
// 2) Plain URL: https://... or http://...
// 3) Bold: **text**
// 4) Italic: *text*
// 5) Code: `code`
const INLINE_REGEX =
  /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<>()]+)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;

function parseInlineTokens(rawText: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_REGEX.lastIndex = 0;
  while ((match = INLINE_REGEX.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", content: rawText.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // Markdown link: [label](url)
      const label = match[2];
      const url = match[3];
      if (isSafeUrl(url)) {
        tokens.push({ type: "link", label, url: url.trim() });
      } else {
        tokens.push({ type: "text", content: match[0] });
      }
    } else if (match[4]) {
      // Plain URL: https?://...
      let rawUrl = match[4];
      let trailing = "";
      const pMatch = rawUrl.match(/[.,;:!?)]+$/);
      if (pMatch) {
        trailing = pMatch[0];
        rawUrl = rawUrl.slice(0, -trailing.length);
      }
      if (isSafeUrl(rawUrl)) {
        tokens.push({ type: "link", label: rawUrl, url: rawUrl });
      } else {
        tokens.push({ type: "text", content: rawUrl });
      }
      if (trailing) {
        tokens.push({ type: "text", content: trailing });
      }
    } else if (match[5]) {
      // **bold**
      tokens.push({ type: "bold", content: match[6] });
    } else if (match[7]) {
      // *italic*
      tokens.push({ type: "italic", content: match[8] });
    } else if (match[9]) {
      // `code`
      tokens.push({ type: "code", content: match[10] });
    }

    lastIndex = INLINE_REGEX.lastIndex;
  }

  if (lastIndex < rawText.length) {
    tokens.push({ type: "text", content: rawText.slice(lastIndex) });
  }

  return tokens;
}

function renderTokens(
  tokens: InlineToken[],
  prefix: string,
  linkClassName?: string
): React.ReactNode {
  return tokens.map((token, i) => {
    const key = `${prefix}-${i}`;
    if (token.type === "link") {
      return (
        <a
          key={key}
          href={token.url}
          target="_blank"
          rel="noopener noreferrer"
          className={
            linkClassName ||
            "inline-flex items-center gap-0.5 text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors font-medium break-all cursor-pointer"
          }
          onClick={(e) => e.stopPropagation()}
        >
          <span>{token.label}</span>
          <ExternalLink className="inline h-3 w-3 shrink-0 opacity-70 ml-0.5" />
        </a>
      );
    }
    if (token.type === "bold") {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {token.content}
        </strong>
      );
    }
    if (token.type === "italic") {
      return (
        <em key={key} className="italic text-neutral-300">
          {token.content}
        </em>
      );
    }
    if (token.type === "code") {
      return (
        <code key={key} className="rounded bg-neutral-800/80 px-1 py-0.5 font-mono text-xs text-purple-300">
          {token.content}
        </code>
      );
    }
    return <React.Fragment key={key}>{token.content}</React.Fragment>;
  });
}

export function FormattedText({ text, className = "", linkClassName }: FormattedTextProps) {
  const content = useMemo(() => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();

      // Horizontal divider: --- or ___ or ***
      if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
        return (
          <hr
            key={`hr-${lineIdx}`}
            className="my-2.5 border-neutral-700/60"
          />
        );
      }

      // Bullet list items: "- " or "* " or "• "
      const bulletMatch = line.match(/^(\s*)[-*•]\s+(.*)$/);
      if (bulletMatch) {
        const indent = bulletMatch[1];
        const itemContent = bulletMatch[2];
        const tokens = parseInlineTokens(itemContent);
        return (
          <div
            key={`li-${lineIdx}`}
            className="flex items-start gap-2 my-0.5"
            style={{ paddingLeft: indent ? `${indent.length * 0.5}rem` : undefined }}
          >
            <span className="text-purple-400 select-none mt-0.5 text-xs">•</span>
            <span className="flex-1 min-w-0 leading-relaxed">
              {renderTokens(tokens, `li-${lineIdx}`, linkClassName)}
            </span>
          </div>
        );
      }

      // Empty line / paragraph break
      if (trimmed === "") {
        return <div key={`empty-${lineIdx}`} className="h-2" />;
      }

      // Regular line
      const tokens = parseInlineTokens(line);
      return (
        <div key={`p-${lineIdx}`} className="leading-relaxed my-0.5">
          {renderTokens(tokens, `p-${lineIdx}`, linkClassName)}
        </div>
      );
    });
  }, [text, linkClassName]);

  if (!content) return null;

  return <div className={className}>{content}</div>;
}
