"use client";

export interface OfflineChapterMetadata {
  id: string;
  chapterId: string;
  chapterNumber: number;
  chapterSlug: string;
  chapterTitle?: string | null;
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  seriesCoverUrl?: string | null;
  pageCount: number;
  downloadedAt: string;
  totalBytes?: number;
}

export interface OfflinePage {
  id: string;
  page_number: number;
  image_url: string;
  blobUrl?: string;
}

const CACHE_NAME = "vnrscans-offline-chapters-v1";
const STORAGE_KEY = "vnr_offline_chapters_meta";

export function isOfflineStorageSupported(): boolean {
  return typeof window !== "undefined" && "caches" in window && "localStorage" in window;
}

export function getOfflineChapters(): OfflineChapterMetadata[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isChapterSavedOffline(chapterId: string): boolean {
  const chapters = getOfflineChapters();
  return chapters.some((c) => c.chapterId === chapterId || c.id === chapterId);
}

export async function saveChapterOffline(
  chapter: {
    id: string;
    chapter_number: number;
    slug: string;
    title?: string | null;
    series_id: string;
    series?: { id: string; slug: string; title: string; cover_url?: string | null } | null;
  },
  pages: { id: string; page_number: number; image_url: string }[],
  onProgress?: (progress: number, loadedPages: number, totalPages: number) => void
): Promise<boolean> {
  if (!isOfflineStorageSupported()) {
    throw new Error("Offline storage is not supported in this browser.");
  }

  const cache = await caches.open(CACHE_NAME);
  const total = pages.length;
  let loaded = 0;
  let totalBytes = 0;

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    try {
      // Check if already in cache
      const cached = await cache.match(p.image_url);
      if (!cached) {
        const resp = await fetch(p.image_url, { mode: "cors", referrerPolicy: "no-referrer" });
        if (resp.ok) {
          const clone = resp.clone();
          const blob = await resp.blob();
          totalBytes += blob.size;
          await cache.put(p.image_url, clone);
        }
      }
    } catch {
      // Fallback: continue downloading remaining pages
    }
    loaded++;
    if (onProgress) {
      onProgress(Math.round((loaded / total) * 100), loaded, total);
    }
  }

  // Also cache cover if present
  if (chapter.series?.cover_url) {
    try {
      const coverResp = await fetch(chapter.series.cover_url, { mode: "cors", referrerPolicy: "no-referrer" });
      if (coverResp.ok) {
        await cache.put(chapter.series.cover_url, coverResp);
      }
    } catch {}
  }

  // Save metadata
  const metaList = getOfflineChapters();
  const existingIdx = metaList.findIndex((c) => c.chapterId === chapter.id);

  const newMeta: OfflineChapterMetadata = {
    id: chapter.id,
    chapterId: chapter.id,
    chapterNumber: chapter.chapter_number,
    chapterSlug: chapter.slug,
    chapterTitle: chapter.title,
    seriesId: chapter.series_id,
    seriesSlug: chapter.series?.slug || "",
    seriesTitle: chapter.series?.title || "Manga",
    seriesCoverUrl: chapter.series?.cover_url,
    pageCount: pages.length,
    downloadedAt: new Date().toISOString(),
    totalBytes,
  };

  if (existingIdx >= 0) {
    metaList[existingIdx] = newMeta;
  } else {
    metaList.unshift(newMeta);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(metaList));
  window.dispatchEvent(new Event("vnr-offline-change"));
  return true;
}

export async function deleteOfflineChapter(chapterId: string): Promise<void> {
  if (!isOfflineStorageSupported()) return;

  const metaList = getOfflineChapters();
  const target = metaList.find((c) => c.chapterId === chapterId || c.id === chapterId);
  const filtered = metaList.filter((c) => c.chapterId !== chapterId && c.id !== chapterId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  window.dispatchEvent(new Event("vnr-offline-change"));
}

export async function getOfflineStorageUsage(): Promise<{ usedMb: string; count: number }> {
  const chapters = getOfflineChapters();
  let totalBytes = chapters.reduce((acc, c) => acc + (c.totalBytes || 0), 0);

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage) {
        totalBytes = estimate.usage;
      }
    } catch {}
  }

  return {
    usedMb: (totalBytes / (1024 * 1024)).toFixed(1),
    count: chapters.length,
  };
}
