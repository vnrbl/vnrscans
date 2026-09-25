import type { SiteCatalogDiscovery, SiteSeriesMetadata } from "./types";
import { fetchHivetoonHtml, isHivetoonUrl } from "../hivetoon-client";

export function isSupportedHivetoonCatalogUrl(value: string): boolean {
  return isHivetoonUrl(value);
}

export async function discoverHivetoonCatalog(inputUrl: string): Promise<SiteCatalogDiscovery> {
  if (!isHivetoonUrl(inputUrl)) {
    throw new Error("This version supports hivetoons.org / hivetoon.com catalog URLs only.");
  }

  const origin = "https://hivetoons.org";
  const url = `${origin}/series/`;

  const html = await fetchHivetoonHtml(url);

  const seen = new Set<string>();
  const series: SiteSeriesMetadata[] = [];

  // 1. Primary: Extract from TSR initialPosts script data
  const postRegex =
    /slug:"([^"]+)",postTitle:"([^"]+)",featuredImage:"([^"]+)",seriesType:"([^"]+)",seriesStatus:"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = postRegex.exec(html)) !== null) {
    const slug = m[1];
    const sourceUrl = `${origin}/series/${slug}`;
    if (seen.has(sourceUrl)) continue;
    seen.add(sourceUrl);

    const title = decodeHtmlEntities(
      m[2]
        .replace(/\\u0026/g, "&")
        .replace(/\\u0027/g, "'")
        .replace(/\\u0022/g, '"')
    ).trim();

    const typeVal = m[4].trim().toLowerCase();
    const type: SiteSeriesMetadata["type"] =
      typeVal === "manga" || typeVal === "manhua" || typeVal === "novel" ? typeVal : "manhwa";

    const statusVal = m[5].trim().toLowerCase();
    const status: SiteSeriesMetadata["status"] =
      statusVal.includes("completed") || statusVal.includes("complete") ? "completed" : "ongoing";

    series.push({
      sourceId: sourceUrl,
      sourceUrl,
      slug,
      title: title || slug,
      alternativeTitles: [],
      description: "",
      coverUrl: m[3] ? decodeHtmlEntities(m[3].trim()) : null,
      type,
      status,
      author: null,
      artist: null,
      genres: [],
      chapterCount: 0,
      lastChapterAt: null,
    });
  }

  // 2. Fallback: Parse card blocks or anchor links if TSR script is unavailable
  if (series.length === 0) {
    const linkMatches = [...html.matchAll(/href=["']\/series\/([^"'/]+)["']/gi)];
    for (const linkMatch of linkMatches) {
      const slug = decodeHtmlEntities(linkMatch[1].trim());
      if (!slug || slug.startsWith("#") || slug.endsWith(".webp") || slug.endsWith(".jpg")) continue;
      const sourceUrl = `${origin}/series/${slug}`;
      if (seen.has(sourceUrl)) continue;
      seen.add(sourceUrl);

      const title = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      series.push({
        sourceId: sourceUrl,
        sourceUrl,
        slug,
        title,
        alternativeTitles: [],
        description: "",
        coverUrl: null,
        type: "manhwa",
        status: "ongoing",
        author: null,
        artist: null,
        genres: [],
        chapterCount: 0,
        lastChapterAt: null,
      });
    }
  }

  if (series.length === 0) {
    throw new Error("No series were found in the Hivetoons catalog.");
  }

  return {
    sourceSite: "Hive Toons",
    canonicalUrl: `${origin}/series`,
    series,
  };
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&#x27;/g, "'")
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