/** Routes that use a bare shell (no site navbar/footer). */
export function isReaderLayoutPath(pathname: string): boolean {
  if (pathname.startsWith("/read/")) return true;
  // /title/:titleSlug/:chapterSlug
  return /^\/title\/[^/]+\/[^/]+$/.test(pathname);
}
