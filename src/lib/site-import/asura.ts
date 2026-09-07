import type { SiteCatalogDiscovery, SiteSeriesMetadata } from "./types";

const ASURA_HOSTS = new Set(["asurascans.com", "www.asurascans.com"]);
const PAGE_SIZE = 20;
const FETCH_CONCURRENCY = 4;

type AsuraSeriesPayload = {
  id?: number;
  slug?: string;
  title?: string;
  alt_titles?: string[];
  description?: string;
  cover?: string;
  status?: string;
  type?: string;
  author?: string;
  artist?: string;
  chapter_count?: number;
  last_chapter_at?: string;
  public_url?: string;
  genres?: Array<{ name?: string }>;
};

type BrowsePayload = {
  totalCount?: number;
  initialTotalPages?: number;
  initialSeries?: AsuraSeriesPayload[];
};

function isAsuraHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ASURA_HOSTS.has(h) || h.includes("asura");
}

export function isSupportedAsuraCatalogUrl(value: string): boolean {
  try {
    return isAsuraHostname(new URL(value).hostname);
  } catch {
    return value.toLowerCase().includes("asura");
  }
}

export async function discoverAsuraCatalog(inputUrl: string): Promise<SiteCatalogDiscovery> {
  const parsed = new URL(inputUrl);
  if (!isAsuraHostname(parsed.hostname)) {
    throw new Error("This version supports Asura catalog URLs only (e.g. asurascans.com).");
  }

  const origin = parsed.origin;
  const firstPage = await fetchBrowsePage(`${origin}/browse?page=1`);
  const totalPages = Math.max(
    1,
    Number(firstPage.initialTotalPages) ||
      Math.ceil((Number(firstPage.totalCount) || firstPage.initialSeries?.length || 0) / PAGE_SIZE),
  );

  const remainingPages = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, index) => index + 2,
  );
  const remainingPayloads = await mapWithConcurrency(remainingPages, FETCH_CONCURRENCY, (page) =>
    fetchBrowsePage(`${origin}/browse?page=${page}`),
  );

  const payloads = [firstPage, ...remainingPayloads];
  const seen = new Set<string>();
  const series: SiteSeriesMetadata[] = [];

  for (const payload of payloads) {
    for (const entry of payload.initialSeries ?? []) {
      const normalized = normalizeAsuraSeries(entry, origin);
      if (!normalized || seen.has(normalized.sourceUrl)) continue;
      seen.add(normalized.sourceUrl);
      series.push(normalized);
    }
  }

  if (series.length === 0) {
    throw new Error("No series were found in the Asura catalog.");
  }

  return {
    sourceSite: "Asura Scans",
    canonicalUrl: `${origin}/browse`,
    series,
  };
}

async function fetchBrowsePage(url: string): Promise<BrowsePayload> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Asura catalog page failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const propsMatch = html.match(
    /<astro-island[^>]*component-url="[^"]*BrowseFilters[^"]*"[^>]*props="([^"]*)"/i,
  );
  if (!propsMatch?.[1]) {
    throw new Error("Asura catalog payload was not found. The site layout may have changed.");
  }

  try {
    const encodedProps = JSON.parse(decodeHtmlEntities(propsMatch[1]));
    return unwrapAstroValue(encodedProps) as BrowsePayload;
  } catch (error) {
    throw new Error(
      `Asura catalog payload could not be decoded: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

function normalizeAsuraSeries(
  entry: AsuraSeriesPayload,
  origin: string,
): SiteSeriesMetadata | null {
  const title = String(entry.title ?? "").trim();
  const publicUrl = String(entry.public_url ?? "").trim();
  if (!title || !publicUrl) return null;

  return {
    sourceId: String(entry.id ?? publicUrl),
    sourceUrl: new URL(publicUrl, origin).toString(),
    slug: String(entry.slug ?? slugify(title)).trim() || slugify(title),
    title,
    alternativeTitles: Array.isArray(entry.alt_titles)
      ? entry.alt_titles.map((value) => String(value).trim()).filter(Boolean)
      : [],
    description: stripHtml(String(entry.description ?? "")),
    coverUrl: entry.cover ? String(entry.cover) : null,
    type: normalizeSeriesType(entry.type),
    status: normalizeSeriesStatus(entry.status),
    author: cleanNullable(entry.author),
    artist: cleanNullable(entry.artist),
    genres: Array.isArray(entry.genres)
      ? entry.genres.map((genre) => String(genre?.name ?? "").trim()).filter(Boolean)
      : [],
    chapterCount: Math.max(0, Number(entry.chapter_count) || 0),
    lastChapterAt: normalizeDate(entry.last_chapter_at),
  };
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
      Object.entries(value).map(([key, nested]) => [key, unwrapAstroValue(nested)]),
    );
  }

  return value;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&amp;/g, "&");
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s*\n\s*/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeSeriesType(value?: string): SiteSeriesMetadata["type"] {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "manga" || normalized === "manhua" || normalized === "novel") {
    return normalized;
  }
  return "manhwa";
}

function normalizeSeriesStatus(value?: string): SiteSeriesMetadata["status"] {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "completed" || normalized === "hiatus") return normalized;
  return "ongoing";
}

function cleanNullable(value?: string): string | null {
  const clean = String(value ?? "").trim();
  return clean || null;
}

function normalizeDate(value?: string): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
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
    Array.from({ length: Math.min(Math.max(1, concurrency), values.length || 1) }, () => worker()),
  );
  return results;
}
