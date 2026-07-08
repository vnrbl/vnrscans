import type { SiteCatalogDiscovery, SiteSeriesMetadata } from "./types";

const HIVETOON_HOSTS = new Set(["hivetoons.org", "www.hivetoons.org"]);

export function isSupportedHivetoonCatalogUrl(value: string): boolean {
  try {
    return HIVETOON_HOSTS.has(new URL(value.trim()).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function discoverHivetoonCatalog(inputUrl: string): Promise<SiteCatalogDiscovery> {
  const parsed = new URL(inputUrl.trim());
  if (!HIVETOON_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("This version supports hivetoons.org catalog URLs only.");
  }

  const origin = parsed.origin;
  const url = `${origin}/series`;
  
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
    throw new Error(`Hivetoons catalog page failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const seen = new Set<string>();
  const series: SiteSeriesMetadata[] = [];

  // Parse using a card regex or structural block matching
  const cardBlocks = html.split(/<div class="overflow-hidden relative flex flex-col[^>]*>/gi);
  for (let i = 1; i < cardBlocks.length; i++) {
    const block = cardBlocks[i];
    
    // Extract href
    const hrefMatch = block.match(/href="\/series\/([^"/]+)"/i);
    if (!hrefMatch) continue;
    const slug = hrefMatch[1];
    const sourceUrl = `${origin}/series/${slug}`;
    if (seen.has(sourceUrl)) continue;

    // Extract title from h1
    const titleMatch = block.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = (titleMatch ? titleMatch[1] : slug)
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;s/g, "'s")
      .trim();

    // Extract cover image src
    const imgMatch = block.match(/<img[^>]*src="([^"]+)"/i);
    const coverUrl = imgMatch ? imgMatch[1].trim() : null;

    // Extract type (Manhwa/Manga/Manhua/Novel)
    const typeMatch = block.match(/bg-pink-500\/90">([\s\S]*?)<\/span>/i);
    const typeVal = typeMatch ? typeMatch[1].trim().toLowerCase() : "manhwa";
    const type: SiteSeriesMetadata["type"] =
      typeVal === "manga" || typeVal === "manhua" || typeVal === "novel" ? typeVal : "manhwa";

    // Extract status (Ongoing/Completed)
    const statusMatch = block.match(/bg-green-500">[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    const statusVal = statusMatch ? statusMatch[1].trim().toLowerCase() : "ongoing";
    const status: SiteSeriesMetadata["status"] =
      statusVal.includes("completed") || statusVal.includes("complete") ? "completed" : "ongoing";

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
      status,
      author: null,
      artist: null,
      genres: [],
      chapterCount: 0,
      lastChapterAt: null,
    });
  }

  if (series.length === 0) {
    throw new Error("No series were found in the Hivetoons catalog.");
  }

  return {
    sourceSite: "Hive Toons",
    canonicalUrl: url,
    series,
  };
}