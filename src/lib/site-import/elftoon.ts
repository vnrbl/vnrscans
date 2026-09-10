import type { SiteCatalogDiscovery, SiteSeriesMetadata } from "./types";

/** All MangaThemesia-based hosts supported by this catalog importer */
const MANGATHEMESIA_HOST_MAP: Record<string, string> = {
  "elftoon.com": "Elf Toons",
  "www.elftoon.com": "Elf Toons",
  "en-thunderscans.com": "Thunder Scans",
  "thunderscans.com": "Thunder Scans",
  "www.thunderscans.com": "Thunder Scans",
  "scythescans.com": "Scythe Scans",
  "www.scythescans.com": "Scythe Scans",
};

export function isSupportedElftoonCatalogUrl(value: string): boolean {
  try {
    return new URL(value.trim()).hostname.toLowerCase() in MANGATHEMESIA_HOST_MAP;
  } catch {
    return false;
  }
}

export async function discoverElftoonCatalog(inputUrl: string): Promise<SiteCatalogDiscovery> {
  const parsed = new URL(inputUrl.trim());
  const hostname = parsed.hostname.toLowerCase();
  const siteName = MANGATHEMESIA_HOST_MAP[hostname];
  if (!siteName) {
    throw new Error(
      `Unsupported site. Supported: ${[...new Set(Object.values(MANGATHEMESIA_HOST_MAP))].join(", ")}`
    );
  }

  const origin = parsed.origin;
  const url = `${origin}/manga/`;
  
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      Referer: `${origin}/`,
    },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${siteName} catalog page failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const seen = new Set<string>();
  const series: SiteSeriesMetadata[] = [];

  // Parse using a card regex or structural block matching
  const cardBlocks = html.split(/<div class="bs">/gi);
  for (let i = 1; i < cardBlocks.length; i++) {
    const block = cardBlocks[i];
    
    // Extract href/slug — generic pattern matching any /manga/slug/ link on this origin
    const escapedHost = hostname.replace(/\./g, "\\.");
    const hrefRegex = new RegExp(`href="https?://(?:www\\.)?${escapedHost}/manga/([^"/]+)/"`, "i");
    const hrefMatch = block.match(hrefRegex);
    if (!hrefMatch) continue;
    const slug = decodeHtmlEntities(hrefMatch[1]);
    const sourceUrl = `${origin}/manga/${slug}/`;
    if (seen.has(sourceUrl)) continue;

    // Extract title from the anchor title or class="tt"
    const titleMatch = block.match(/title="([^"]+)"/i) || block.match(/class="tt">([\s\S]*?)<\/div>/i);
    const title = decodeHtmlEntities(titleMatch ? titleMatch[1].trim() : slug);

    // Extract cover image src
    const imgMatch = block.match(/data-src="([^"]+)"/i) || block.match(/src="([^"]+)"/i);
    const coverUrl = imgMatch ? decodeHtmlEntities(imgMatch[1].trim()) : null;

    // Extract type (Manhwa/Manga/Manhua/Novel)
    const typeMatch = block.match(/class="type ([^"]+)"/i);
    const typeVal = typeMatch ? typeMatch[1].trim().toLowerCase() : "manhwa";
    const type: SiteSeriesMetadata["type"] =
      typeVal === "manga" || typeVal === "manhua" || typeVal === "novel" ? typeVal : "manhwa";

    // Chapter count if present
    const epMatch = block.match(/class="epxs">Chapter (\d+)<\/div>/i);
    const chapterCount = epMatch ? Number(epMatch[1]) : 0;

    seen.add(sourceUrl);
    series.push({
      sourceId: sourceUrl,
      sourceUrl,
      slug,
      title,
      alternativeTitles: [],
      description: "",
      coverUrl,
      type,
      status: "ongoing", // Default
      author: null,
      artist: null,
      genres: [],
      chapterCount,
      lastChapterAt: null,
    });
  }

  if (series.length === 0) {
    throw new Error(`No series were found in the ${siteName} catalog.`);
  }

  return {
    sourceSite: siteName,
    canonicalUrl: url,
    series,
  };
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10))
    )
    .replace(/&amp;/g, "&");
}