/**
 * Utilities for formatting, cleaning, and smart-pasting novel text.
 * Preserves exact spaces, paragraph indentations, and line gaps from source websites/documents.
 */

/**
 * Extracts and formats content from clipboard (handling both rich HTML and plain text)
 * ensuring paragraph line gaps and spaces are faithfully preserved.
 */
export function extractClipboardNovelText(clipboardData: DataTransfer): string {
  const html = clipboardData.getData("text/html");
  const plain = clipboardData.getData("text/plain");

  if (html && html.trim()) {
    try {
      const parsed = parseHtmlToNovelText(html);
      if (parsed && parsed.trim().length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse clipboard HTML, falling back to plain text", e);
    }
  }

  // If plain text was provided, normalize line endings
  if (plain) {
    return normalizePlainNovelText(plain);
  }

  return "";
}

/**
 * Converts rich HTML (from websites, Word, Google Docs) into cleanly spaced novel text
 * preserving paragraph breaks (as \n\n), line breaks, spaces, indentation, and key formatting tags.
 */
export function parseHtmlToNovelText(html: string): string {
  if (typeof window === "undefined") return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove scripts, styles, meta, noscript
  const unneeded = doc.querySelectorAll("script, style, meta, noscript, link, svg");
  unneeded.forEach((el) => el.remove());

  // Function to recursively process nodes
  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      // Preserve spaces exactly as they are in text nodes (do not collapse spaces!)
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    // Check for CSS text-indent (e.g. style="text-indent: 2em")
    const styleAttr = el.getAttribute("style") || "";
    const hasIndent = /text-indent\s*:\s*([^;]+)/i.test(styleAttr);
    const indentPrefix = hasIndent ? "    " : "";

    // Handle line breaks
    if (tagName === "br") {
      return "\n";
    }

    // Process children
    let innerText = "";
    for (let i = 0; i < el.childNodes.length; i++) {
      innerText += processNode(el.childNodes[i]);
    }

    // Handle inline formatting tags to preserve styling
    if (tagName === "strong" || tagName === "b") {
      if (!innerText.trim()) return innerText;
      return `<strong>${innerText}</strong>`;
    }
    if (tagName === "em" || tagName === "i") {
      if (!innerText.trim()) return innerText;
      return `<em>${innerText}</em>`;
    }
    if (tagName === "u") {
      if (!innerText.trim()) return innerText;
      return `<u>${innerText}</u>`;
    }
    if (tagName === "s" || tagName === "strike" || tagName === "del") {
      if (!innerText.trim()) return innerText;
      return `<s>${innerText}</s>`;
    }
    if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
      const clean = innerText.replace(/^\n+|\n+$/g, "");
      return clean ? `\n\n### ${clean}\n\n` : "";
    }
    if (tagName === "blockquote") {
      const clean = innerText.replace(/^\n+|\n+$/g, "");
      return clean ? `\n\n<blockquote>${clean}</blockquote>\n\n` : "";
    }

    // Block elements that represent paragraphs / separate lines
    const isBlock = [
      "p", "div", "section", "article", "li", "tr", "dt", "dd"
    ].includes(tagName);

    if (isBlock) {
      // Trim empty enclosing newlines from inner text, but preserve leading indent spaces
      const trailingClean = innerText.replace(/[\r\n]+$/, "");
      const leadingClean = trailingClean.replace(/^[\r\n]+/, "");

      if (!leadingClean.trim()) {
        // Empty block or spacer paragraph
        return "\n\n";
      }

      return `\n\n${indentPrefix}${leadingClean}\n\n`;
    }

    return innerText;
  }

  const rawOutput = processNode(doc.body || doc.documentElement);

  // Normalize excessive newlines (max 2 consecutive newlines, i.e. 1 empty line gap)
  return rawOutput
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Normalizes plain text, converting single newlines between paragraphs to double newlines
 * if text was copied as consecutive single lines without line gaps.
 */
export function normalizePlainNovelText(text: string): string {
  if (!text) return "";
  let clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Check if text already has double newlines (paragraphs separated by blank lines)
  const hasDouble = /\n\s*\n/.test(clean);
  if (hasDouble) {
    // Already has line gaps; just normalize 3+ newlines to double newlines
    return clean.replace(/\n{3,}/g, "\n\n");
  }

  // If text only has single newlines, every line is likely a paragraph from a web source.
  // Add line gaps between lines.
  const lines = clean.split("\n");
  if (lines.length > 2) {
    return lines
      .map((l) => l.replace(/[ \t]+$/, "")) // keep leading indentation, trim trailing whitespace
      .filter((l) => l.length > 0)
      .join("\n\n");
  }

  return clean;
}

/**
 * Automatically ensures every paragraph has a proper blank line gap (\n\n) between it.
 * Perfect for fixing text where paragraphs are crammed onto adjacent single lines.
 */
export function autoFormatLineGaps(text: string): string {
  if (!text) return "";
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");

  const resultLines: string[] = [];
  let prevWasEmpty = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isLineEmpty = line.trim().length === 0;

    if (isLineEmpty) {
      if (!prevWasEmpty && resultLines.length > 0) {
        resultLines.push("");
        prevWasEmpty = true;
      }
    } else {
      // If previous line was not empty and this is not the first line, insert a blank line gap
      if (!prevWasEmpty && resultLines.length > 0) {
        resultLines.push("");
      }
      resultLines.push(line);
      prevWasEmpty = false;
    }
  }

  return resultLines.join("\n");
}

/**
 * Adds traditional novel indentation (4 spaces) to the beginning of every paragraph.
 */
export function indentParagraphs(text: string, indent = "    "): string {
  if (!text) return "";
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  return lines
    .map((line) => {
      if (!line.trim()) return line;
      // If already indented with spaces or tab, don't double indent
      if (/^(\s{2,}|\t)/.test(line)) return line;
      return indent + line;
    })
    .join("\n");
}

/**
 * Removes leading spaces and tabs from each paragraph.
 */
export function removeIndentation(text: string): string {
  if (!text) return "";
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  return lines
    .map((line) => line.replace(/^\s+/, ""))
    .join("\n");
}

/**
 * Normalizes all spacing and line gaps cleanly.
 */
export function cleanSpacedText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+$/gm, "") // trim trailing spaces per line
    .replace(/\n{3,}/g, "\n\n") // max 1 blank line gap
    .trim();
}
