/** Routes that use a bare shell (no site navbar/footer). */
export function isReaderLayoutPath(pathname: string): boolean {
  if (pathname.startsWith("/read/")) return true;
  if (pathname.startsWith("/status")) return true;
  // /title/:titleSlug/:chapterSlug
  return /^\/title\/[^/]+\/[^/]+$/.test(pathname);
}

