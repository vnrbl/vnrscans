/** Routes that use a bare shell (no site navbar/footer). */
export function isReaderLayoutPath(pathname: string): boolean {
  if (pathname.startsWith("/read/")) return true;
  if (pathname.startsWith("/status")) return true;
  // /title/:titleSlug/:chapterSlug
  return /^\/title\/[^/]+\/[^/]+$/.test(pathname);
}

/** Routes that are specifically chapter reading / chapters pages. */
export function isChapterReadingPath(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/read/")) return true;
  if (pathname.includes("/chapter")) return true;
  // /title/:titleSlug/:chapterSlug
  return /^\/title\/[^/]+\/[^/]+$/.test(pathname);
}

