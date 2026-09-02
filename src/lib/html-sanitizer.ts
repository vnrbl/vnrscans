/**
 * Lightweight and strict HTML sanitizer for novel reader and rich text display
 * Strips executable scripts, event handlers, frames, and dangerous URI schemes.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "strike", "del",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "span", "div",
  "hr", "ul", "ol", "li", "img", "table", "thead", "tbody", "tr", "th", "td", "pre", "code"
]);

const ALLOWED_ATTRS = new Set([
  "src", "alt", "class", "className", "style", "title", "width", "height"
]);

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return "";

  // 1. Remove script, iframe, frame, embed, object, and applet blocks entirely
  let clean = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, "");

  // 2. Strip all inline on* event handlers (e.g. onerror, onload, onclick)
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 3. Strip dangerous URI schemes (javascript:, vbscript:, data:text/html)
  clean = clean.replace(/(?:src|href)\s*=\s*['"]?\s*(?:javascript|vbscript|data\s*:\s*text\/html):/gi, 'src="about:blank');

  return clean;
}
