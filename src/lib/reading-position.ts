export interface ReadingPosition {
  chapterId: string;
  chapterSlug: string;
  chapterNumber: number;
  seriesSlug: string;
  seriesId?: string;
  pageIndex: number;
  scrollRatio: number;
  scrollTop: number;
  timestamp: number;
}

const POSITION_PREFIX = "vnr-reading-pos-";
const LAST_READ_PREFIX = "vnr-last-read-";

export function saveChapterReadingPosition(pos: Omit<ReadingPosition, "timestamp">) {
  if (typeof window === "undefined") return;
  try {
    const payload: ReadingPosition = {
      ...pos,
      timestamp: Date.now(),
    };

    // Save per chapter position
    localStorage.setItem(`${POSITION_PREFIX}${pos.chapterId}`, JSON.stringify(payload));

    // Save per series last read chapter
    if (pos.seriesSlug) {
      localStorage.setItem(`${LAST_READ_PREFIX}${pos.seriesSlug}`, JSON.stringify({
        slug: pos.chapterSlug,
        chapter_number: pos.chapterNumber,
        chapter_id: pos.chapterId,
        page_index: pos.pageIndex,
        scroll_ratio: pos.scrollRatio,
        timestamp: Date.now(),
      }));
      // Legacy compatibility keys
      localStorage.setItem(`last-read-${pos.seriesSlug}`, JSON.stringify({
        slug: pos.chapterSlug,
        chapter_number: pos.chapterNumber,
        chapter_id: pos.chapterId,
      }));
    }
  } catch (err) {
    console.warn("Failed to save reading position to localStorage:", err);
  }
}

export function getChapterReadingPosition(chapterId: string): ReadingPosition | null {
  if (typeof window === "undefined" || !chapterId) return null;
  try {
    const raw = localStorage.getItem(`${POSITION_PREFIX}${chapterId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ReadingPosition;
  } catch {
    return null;
  }
}

export function getLastReadChapter(seriesSlug: string): {
  slug: string;
  chapter_number: number;
  chapter_id?: string;
  page_index?: number;
  scroll_ratio?: number;
} | null {
  if (typeof window === "undefined" || !seriesSlug) return null;
  try {
    const modern = localStorage.getItem(`${LAST_READ_PREFIX}${seriesSlug}`);
    if (modern) return JSON.parse(modern);
    const legacy = localStorage.getItem(`last-read-${seriesSlug}`);
    if (legacy) return JSON.parse(legacy);
    return null;
  } catch {
    return null;
  }
}
