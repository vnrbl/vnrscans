/**
 * Document Parser for Novel Chapters
 * Supports uploading and importing Word (.docx, .doc), PDF (.pdf), Text (.txt), and Markdown (.md) documents.
 * Preserves paragraph formatting, line gaps, spaces, and text styles.
 */

import { parseHtmlToNovelText, autoFormatLineGaps, normalizePlainNovelText } from "@/lib/novel-formatter";
export { autoFormatLineGaps, normalizePlainNovelText };

export interface ParsedDocumentResult {
  text: string;
  wordCount: number;
  characterCount: number;
  chapterNumberSuggestion?: string;
  chapterTitleSuggestion?: string;
  sourceFormat: "docx" | "doc" | "pdf" | "txt" | "md";
  warnings?: string[];
}

/**
 * Extracts chapter number and title suggestions from a filename.
 * Handles patterns such as:
 * - "Chapter 12 - Return of the King.docx" -> { chapterNumber: "12", chapterTitle: "Return of the King" }
 * - "Ch. 5_The Awakening.pdf" -> { chapterNumber: "5", chapterTitle: "The Awakening" }
 * - "15 - Frost Sovereign.docx" -> { chapterNumber: "15", chapterTitle: "Frost Sovereign" }
 * - "Chapter 100.txt" -> { chapterNumber: "100" }
 */
export function extractChapterMetaFromFilename(filename: string): {
  chapterNumber?: string;
  chapterTitle?: string;
} {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "").trim();

  // Pattern 1: Chapter/Ch/Episode [0-9]+ (separator) [Title]
  const matchWithTitle = nameWithoutExt.match(
    /^(?:chapter|ch\.?|ep\.?|episode)?\s*([0-9]+(?:\.[0-9]+)?)\s*[:\-_–—]\s*(.+)$/i
  );
  if (matchWithTitle) {
    return {
      chapterNumber: matchWithTitle[1],
      chapterTitle: matchWithTitle[2].trim(),
    };
  }

  // Pattern 2: Chapter/Ch [0-9]+ [Title without separator]
  const matchChWords = nameWithoutExt.match(
    /^(?:chapter|ch\.?|ep\.?)\s*([0-9]+(?:\.[0-9]+)?)\s+([A-Za-z0-9].*)$/i
  );
  if (matchChWords) {
    return {
      chapterNumber: matchChWords[1],
      chapterTitle: matchChWords[2].trim(),
    };
  }

  // Pattern 3: Chapter/Ch [0-9]+ only
  const matchNumberOnly = nameWithoutExt.match(/^(?:chapter|ch\.?|ep\.?)?\s*([0-9]+(?:\.[0-9]+)?)$/i);
  if (matchNumberOnly) {
    return {
      chapterNumber: matchNumberOnly[1],
    };
  }

  // If no chapter number matched, use filename as title suggestion
  return {
    chapterTitle: nameWithoutExt,
  };
}

/**
 * Parses a File object (.docx, .doc, .pdf, .txt, .md) and converts it
 * into formatted novel text ready for the chapter editor.
 */
export async function parseNovelDocumentFile(file: File): Promise<ParsedDocumentResult> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const suggestions = extractChapterMetaFromFilename(file.name);

  if (extension === "docx" || extension === "doc") {
    return await parseWordDocument(file, suggestions);
  }

  if (extension === "pdf") {
    return await parsePdfDocument(file, suggestions);
  }

  if (extension === "txt" || extension === "md") {
    return await parseTextDocument(file, suggestions, extension as "txt" | "md");
  }

  throw new Error(`Unsupported file type: .${extension}. Please upload a .docx, .doc, .pdf, or .txt file.`);
}

/**
 * Parses Word (.docx, .doc) files.
 * Uses mammoth to convert OpenXML to HTML, then converts HTML to novel text.
 */
async function parseWordDocument(
  file: File,
  suggestions: { chapterNumber?: string; chapterTitle?: string }
): Promise<ParsedDocumentResult> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const mammoth = (await import("mammoth")).default;
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    if (!html || !html.trim()) {
      // Fallback: try extractRawText
      const rawResult = await mammoth.extractRawText({ arrayBuffer });
      const rawText = autoFormatLineGaps(normalizePlainNovelText(rawResult.value || ""));
      return calculateResult(rawText, "docx", suggestions, result.messages.map((m) => m.message));
    }

    const novelText = autoFormatLineGaps(parseHtmlToNovelText(html));
    return calculateResult(novelText, "docx", suggestions, result.messages.map((m) => m.message));
  } catch (err: any) {
    // If older binary .doc format fails in mammoth, attempt plain text recovery
    if (file.name.toLowerCase().endsWith(".doc")) {
      const recovered = tryExtractLegacyDocStrings(arrayBuffer);
      if (recovered && recovered.length > 50) {
        return calculateResult(
          autoFormatLineGaps(recovered),
          "doc",
          suggestions,
          ["Imported legacy .doc text. For best formatting, save as modern .docx in Word."]
        );
      }
      throw new Error(
        "Could not read legacy Word (.doc) binary format. Please open it in Microsoft Word or Google Docs and save as modern (.docx), then try again."
      );
    }
    throw new Error(`Failed to parse Word document: ${err?.message || "Unknown error"}`);
  }
}

/**
 * Extracts plain text from legacy Word 97-2003 binary files as a best-effort fallback.
 */
function tryExtractLegacyDocStrings(buffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(buffer);
  let result = "";
  let inString = false;
  let currentWord = "";

  for (let i = 0; i < uint8.length; i++) {
    const code = uint8[i];
    // Printable ASCII or newline/tab
    if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
      currentWord += String.fromCharCode(code);
      inString = true;
    } else {
      if (inString) {
        if (currentWord.trim().length > 3) {
          result += currentWord + " ";
        }
        currentWord = "";
        inString = false;
      }
    }
  }

  // Filter out binary garbage blocks
  return result
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10 && !/[^\x20-\x7E\s]/.test(l))
    .join("\n\n");
}

/**
 * Dynamically loads PDF.js in the browser on-demand from CDN.
 * Prevents Next.js webpack 'canvas' native dependency bundling failures.
 */
async function loadPdfJsLib(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("PDF processing is only supported in browser environment.");
  }

  const existingLib = (window as any).pdfjsLib;
  if (existingLib) return existingLib;

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById("pdfjs-cdn-script");
    if (existingScript) {
      if ((window as any).pdfjsLib) {
        resolve();
      } else {
        existingScript.addEventListener("load", () => resolve());
        existingScript.addEventListener("error", () => reject(new Error("Failed to load PDF library")));
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "pdfjs-cdn-script";
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      resolve();
    };
    script.onerror = () => reject(new Error("Could not load PDF processing engine. Please check your internet connection."));
    document.head.appendChild(script);
  });

  return (window as any).pdfjsLib;
}

/**
 * Parses PDF (.pdf) documents using pdfjs-dist.
 * Reconstructs lines and detects paragraph vertical gaps.
 */
async function parsePdfDocument(
  file: File,
  suggestions: { chapterNumber?: string; chapterTitle?: string }
): Promise<ParsedDocumentResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjs = await loadPdfJsLib();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items as any[];

    if (!items || items.length === 0) continue;

    // Sort items vertically (top to bottom) then horizontally (left to right)
    items.sort((a, b) => {
      const yA = a.transform ? a.transform[5] : 0;
      const yB = b.transform ? b.transform[5] : 0;
      if (Math.abs(yA - yB) > 4) {
        return yB - yA; // higher Y is higher on the page
      }
      const xA = a.transform ? a.transform[4] : 0;
      const xB = b.transform ? b.transform[4] : 0;
      return xA - xB;
    });

    let lastY: number | null = null;
    let pageStr = "";

    for (const item of items) {
      if (typeof item.str !== "string") continue;
      const str = item.str;
      if (!str && !item.hasEOL) continue;

      const currentY = item.transform ? item.transform[5] : null;

      if (lastY !== null && currentY !== null) {
        const deltaY = Math.abs(currentY - lastY);
        if (deltaY > 5) {
          // Large vertical gap indicates paragraph break
          if (deltaY > 16) {
            pageStr += "\n\n";
          } else {
            pageStr += "\n";
          }
        } else if (pageStr.length > 0 && !pageStr.endsWith("\n") && !pageStr.endsWith(" ") && str.trim()) {
          pageStr += " ";
        }
      }

      pageStr += str;
      if (currentY !== null) {
        lastY = currentY;
      }
    }

    if (pageStr.trim()) {
      pageTexts.push(pageStr.trim());
    }
  }

  const combinedText = autoFormatLineGaps(pageTexts.join("\n\n"));
  return calculateResult(combinedText, "pdf", suggestions);
}

/**
 * Parses plain text (.txt) and Markdown (.md) documents.
 */
async function parseTextDocument(
  file: File,
  suggestions: { chapterNumber?: string; chapterTitle?: string },
  format: "txt" | "md"
): Promise<ParsedDocumentResult> {
  const text = await file.text();
  const formatted = autoFormatLineGaps(normalizePlainNovelText(text));
  return calculateResult(formatted, format, suggestions);
}

/**
 * Computes word count, character count, and packages result.
 */
function calculateResult(
  text: string,
  format: "docx" | "doc" | "pdf" | "txt" | "md",
  suggestions: { chapterNumber?: string; chapterTitle?: string },
  warnings?: string[]
): ParsedDocumentResult {
  const clean = text.trim();
  const plainTextOnly = clean.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const words = plainTextOnly ? plainTextOnly.trim().split(" ").length : 0;
  const characterCount = clean.length;

  return {
    text: clean,
    wordCount: words,
    characterCount,
    chapterNumberSuggestion: suggestions.chapterNumber,
    chapterTitleSuggestion: suggestions.chapterTitle,
    sourceFormat: format,
    warnings,
  };
}
