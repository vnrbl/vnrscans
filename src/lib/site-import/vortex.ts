import type { SiteCatalogDiscovery, SiteSeriesMetadata } from "./types";

const VORTEX_HOSTS = new Set([
  "vortexscans.org",
  "www.vortexscans.org",
  "vortexscans.com",
  "www.vortexscans.com",
  "vortexscans.net",
  "www.vortexscans.net",
]);

const PAGE_SIZE = 48;
const FETCH_CONCURRENCY = 6;

export function isSupportedVortexCatalogUrl(value: string): boolean {
  try {
    return VORTEX_HOSTS.has(new URL(value.trim()).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function discoverVortexCatalog(inputUrl: string): Promise<SiteCatalogDiscovery> {
  const parsed = new URL(inputUrl.trim());
  if (!VORTEX_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("This version supports vortexscans.org catalog URLs only.");
  }

  const origin = parsed.origin;
  const firstPageUrl = `${origin}/series?page=1`;

  const response = await fetch(firstPageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Vortex Scans catalog page failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const totalItemsMatch = html.match(/Found\s*(\d+)\s*series/i);
  const totalItems = totalItemsMatch ? Number(totalItemsMatch[1]) : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // If no total items is matched, fallback to checking how many pages have content, up to a safety limit
  const remainingPages = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, index) => index + 2
  );

  const pagePayloads = await mapWithConcurrency(
    remainingPages,
    3,
    async (page) => {
      try {
        const pageUrl = `${origin}/series?page=${page}`;
        const pageRes = await fetch(pageUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(30_000),
        });
        if (pageRes.ok) {
          return await pageRes.text();
        }
      } catch (err) {
        console.warn(`[Vortex Scans] Failed to fetch catalog page ${page}:`, err);
      }
      return "";
    }
  );

  const allPagesHtml = [html, ...pagePayloads];
  const seen = new Set<string>();
  const basicItems: Array<{
    slug: string;
    title: string;
    coverUrl: string | null;
    type: SiteSeriesMetadata["type"];
    status: SiteSeriesMetadata["status"];
  }> = [];

  for (const pageHtml of allPagesHtml) {
    if (!pageHtml) continue;
    const cardBlocks = pageHtml.split(
      /<div class="relative h-full p-1 sm:p-2 flex gap-2 sm:gap-4 rounded-xl border bg-card text-card-foreground shadow">/gi
    );
    for (let i = 1; i < cardBlocks.length; i++) {
      const block = cardBlocks[i];
      const hrefMatch = block.match(/href="\/series\/([^"/]+)"/i);
      if (!hrefMatch) continue;
      const slug = decodeHtmlEntities(hrefMatch[1]);
      if (seen.has(slug)) continue;
      seen.add(slug);

      const titleMatch = block.match(/class="[^"]*font-bold[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
      const title = titleMatch ? titleMatch[1].trim() : slug;

      const imgMatch = block.match(/<img[^>]*src="([^"]+)"/i);
      const coverUrl = imgMatch ? decodeHtmlEntities(imgMatch[1]) : null;

      const typeMatch =
        block.match(/bg-pink-500\/90">([\s\S]*?)<\/span>/i) ||
        block.match(/rounded-\[4px\] text-xs font-medium text-white[^>]*>([\s\S]*?)<\/span>/i);
      const typeVal = typeMatch ? typeMatch[1].trim().toLowerCase() : "manhwa";

      const statusMatch =
        block.match(/bg-green-500"[^>]*><\/span><p[^>]*>([\s\S]*?)<\/p>/i) ||
        block.match(/bg-[^"]+"><\/span><p[^>]*>([\s\S]*?)<\/p>/i);
      const statusVal = statusMatch ? statusMatch[1].trim().toLowerCase() : "ongoing";

      basicItems.push({
        slug,
        title: decodeHtmlEntities(title),
        coverUrl,
        type: typeVal === "manga" || typeVal === "manhua" || typeVal === "novel" ? typeVal : "manhwa",
        status:
          statusVal.includes("completed") || statusVal.includes("complete")
            ? "completed"
            : statusVal.includes("hiatus")
            ? "hiatus"
            : "ongoing",
      });
    }
  }

  if (basicItems.length === 0) {
    throw new Error("No series were found in the Vortex Scans catalog.");
  }

  // Concurrently fetch detail page for each series to get rich metadata
  const series: SiteSeriesMetadata[] = await mapWithConcurrency(
    basicItems,
    FETCH_CONCURRENCY,
    async (item) => {
      const sourceUrl = `${origin}/series/${item.slug}`;
      const defaultData: SiteSeriesMetadata = {
        sourceId: sourceUrl,
        sourceUrl,
        slug: item.slug,
        title: item.title,
        alternativeTitles: [],
        description: "",
        coverUrl: item.coverUrl,
        type: item.type,
        status: item.status,
        author: null,
        artist: null,
        genres: [],
        chapterCount: 0,
        lastChapterAt: null,
      };

      try {
        const detailRes = await fetch(sourceUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(15_000),
        });

        if (!detailRes.ok) return defaultData;
        const detailHtml = await detailRes.text();

        const islandMatch =
          detailHtml.match(
            /<astro-island[^>]*props="([^"]*)"[^>]*opts="\{&quot;name&quot;:&quot;SeriesDescriptionIsland&quot;/i
          ) ||
          detailHtml.match(
            /<astro-island[^>]*opts="\{&quot;name&quot;:&quot;SeriesDescriptionIsland&quot;[^>]*props="([^"]*)"/i
          );

        if (!islandMatch) return defaultData;

        const decoded = decodeHtmlEntities(islandMatch[1]);
        const parsed = JSON.parse(decoded);
        const unwrapped = unwrapAstroValue(parsed) as any;
        const post = unwrapped?.post;
        if (!post) return defaultData;

        const alternativeTitles = post.alternativeTitles
          ? String(post.alternativeTitles)
              .split(/[,;\n|]+/)
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        // Exclude the type string (e.g. "Manhwa") from the genres array if present
        const genres = Array.isArray(post.genres)
          ? post.genres
              .map((g: any) => String(g?.name ?? "").trim())
              .filter((name: string) => name && name.toLowerCase() !== item.type.toLowerCase())
          : [];

        return {
          ...defaultData,
          alternativeTitles,
          description: stripHtml(post.postContent || ""),
          author: post.author?.trim() || null,
          artist: post.artist?.trim() || null,
          genres,
          chapterCount: Math.max(0, Number(post._count?.chapters) || 0),
          lastChapterAt: normalizeDate(post.lastChapterAddedAt),
        };
      } catch (err) {
        console.warn(`[Vortex Scans] Failed to fetch details for series ${item.slug}:`, err);
        return defaultData;
      }
    }
  );

  return {
    sourceSite: "Vortex Scans",
    canonicalUrl: `${origin}/series`,
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

function unwrapAstroValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (value.length === 2 && (value[0] === 0 || value[0] === 1)) {
      return unwrapAstroValue(value[1]);
    }
    return value.map(unwrapAstroValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, unwrapAstroValue(nested)])
    );
  }

  return value;
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s*\n\s*/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeDate(value?: string): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await mapper(values[index]);
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), values.length || 1) },
      () => worker()
    )
  );
  return results;
}
