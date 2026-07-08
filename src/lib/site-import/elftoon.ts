import type { SiteCatalogDiscovery, SiteSeriesMetadata } from "./types";

const ELFTOON_HOSTS = new Set(["elftoon.com", "www.elftoon.com"]);

export function isSupportedElftoonCatalogUrl(value: string): boolean {
  try {
    return ELFTOON_HOSTS.has(new URL(value.trim()).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function discoverElftoonCatalog(inputUrl: string): Promise<SiteCatalogDiscovery> {
  const parsed = new URL(inputUrl.trim());
  if (!ELFTOON_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("This version supports elftoon.com catalog URLs only.");
  }

  const origin = parsed.origin;
  const url = `${origin}/manga/`;
  
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Elftoon catalog page failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const seen = new Set<string>();
  const series: SiteSeriesMetadata[] = [];

  // Parse using a card regex or structural block matching
  const cardBlocks = html.split(/<div class="bs">/gi);
  for (let i = 1; i < cardBlocks.length; i++) {
    const block = cardBlocks[i];
    
    // Extract href/slug
    const hrefMatch = block.match(/href="https:\/\/elftoon\.com\/manga\/([^"\/]+)\/"/i);
    if (!hrefMatch) continue;
    const slug = hrefMatch[1];
    const sourceUrl = `${origin}/manga/${slug}/`;
    if (seen.has(sourceUrl)) continue;

    // Extract title from the anchor title or class="tt"
    const titleMatch = block.match(/title="([^"]+)"/i) || block.match(/class="tt">([\s\S]*?)<\/div>/i);
    const title = titleMatch ? titleMatch[1].trim() : slug;

    // Extract cover image src
    const imgMatch = block.match(/data-src="([^"]+)"/i) || block.match(/src="([^"]+)"/i);
    const coverUrl = imgMatch ? imgMatch[1].trim() : null;

    // Extract type (Manhwa/Manga/Manhua/Novel)
    const typeMatch = block.match(/class="type ([^"]+)"/i);
    let typeVal = typeMatch ? typeMatch[1].trim().toLowerCase() : "manhwa";
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
    throw new Error("No series were found in the Elftoon catalog.");
  }

  return {
    sourceSite: "Elf Toons",
    canonicalUrl: url,
    series,
  };
}