import type { SiteCatalogDiscovery, SiteSeriesMetadata } from "./types";

const QI_HOSTS = new Set([
  "qimanhwa.com",
  "www.qimanhwa.com",
  "qiscans.org",
  "www.qiscans.org",
  "qimanga.com",
  "www.qimanga.com",
]);

const FETCH_CONCURRENCY = 10;
const PAGE_SIZE = 100;

type QiSeriesListItem = {
  id?: number;
  slug?: string;
  title?: string;
  alternativeTitles?: string;
  cover?: string;
  type?: string;
  status?: string;
};

type QiSeriesDetail = QiSeriesListItem & {
  description?: string;
  author?: string;
  artist?: string;
  lastChapterAddedAt?: string;
  genres?: Array<{ id?: number; name?: string; slug?: string }>;
  stats?: { chapterCount?: number };
};

type QiCatalogPagePayload = {
  totalItems?: number;
  totalPages?: number;
  current?: number;
  data?: QiSeriesListItem[];
};

export function isSupportedQiScansCatalogUrl(value: string): boolean {
  try {
    return QI_HOSTS.has(new URL(value.trim()).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function discoverQiScansCatalog(inputUrl: string): Promise<SiteCatalogDiscovery> {
  const parsed = new URL(inputUrl.trim());
  const host = parsed.hostname.toLowerCase();
  if (!QI_HOSTS.has(host)) {
    throw new Error("Invalid Qi Scans catalog URL.");
  }

  const origin = parsed.origin;
  const firstPage = await fetchCatalogPage(1);
  const totalPages = Math.max(
    1,
    Number(firstPage.totalPages) ||
      Math.ceil((Number(firstPage.totalItems) || firstPage.data?.length || 0) / PAGE_SIZE),
  );

  const remainingPages = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, index) => index + 2,
  );

  const remainingPayloads = await mapWithConcurrency(
    remainingPages,
    3,
    (page) => fetchCatalogPage(page),
  );

  const allListItems: QiSeriesListItem[] = [
    ...(firstPage.data ?? []),
    ...remainingPayloads.flatMap((p) => p.data ?? []),
  ];

  const seenSlugs = new Set<string>();
  const uniqueListItems: QiSeriesListItem[] = [];
  for (const item of allListItems) {
    if (item.slug && !seenSlugs.has(item.slug)) {
      seenSlugs.add(item.slug);
      uniqueListItems.push(item);
    }
  }

  if (uniqueListItems.length === 0) {
    throw new Error("No series were found in the Qi Scans catalog.");
  }

  const detailedItems = await mapWithConcurrency(
    uniqueListItems,
    FETCH_CONCURRENCY,
    async (item) => {
      if (!item.slug) return item as QiSeriesDetail;
      try {
        const detail = await fetchSeriesDetail(item.slug);
        return { ...item, ...detail };
      } catch {
        return item as QiSeriesDetail;
      }
    },
  );

  const series: SiteSeriesMetadata[] = [];
  const seenUrls = new Set<string>();

  for (const item of detailedItems) {
    const normalized = normalizeQiSeries(item, origin);
    if (!normalized || seenUrls.has(normalized.sourceUrl)) continue;
    seenUrls.add(normalized.sourceUrl);
    series.push(normalized);
  }

  return {
    sourceSite: "Qi Scans",
    canonicalUrl: `${origin}/series`,
    series,
  };
}

async function fetchCatalogPage(page: number): Promise<QiCatalogPagePayload> {
  const url = `https://api.qimanga.com/api/v1/series?page=${page}&perPage=${PAGE_SIZE}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Qi Scans catalog page ${page} failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as QiCatalogPagePayload;
}

async function fetchSeriesDetail(slug: string): Promise<QiSeriesDetail> {
  const url = `https://api.qimanga.com/api/v1/series/${encodeURIComponent(slug)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Qi Scans series detail for ${slug} failed: ${response.status}`);
  }

  return (await response.json()) as QiSeriesDetail;
}

function normalizeQiSeries(
  entry: QiSeriesDetail,
  origin: string,
): SiteSeriesMetadata | null {
  const title = String(entry.title ?? "").trim();
  const slug = String(entry.slug ?? "").trim();
  if (!title || !slug) return null;

  const sourceUrl = `${origin}/series/${slug}`;

  const altTitlesRaw = entry.alternativeTitles ?? "";
  const alternativeTitles = altTitlesRaw
    .split(/[,;\n]+/)
    .map((val) => val.trim())
    .filter(Boolean);

  const genres = Array.isArray(entry.genres)
    ? entry.genres.map((g) => String(g?.name ?? "").trim()).filter(Boolean)
    : [];

  return {
    sourceId: String(entry.id ?? slug),
    sourceUrl,
    slug,
    title,
    alternativeTitles,
    description: stripHtml(String(entry.description ?? "")),
    coverUrl: entry.cover ? String(entry.cover) : null,
    type: normalizeSeriesType(entry.type),
    status: normalizeSeriesStatus(entry.status),
    author: cleanNullable(entry.author),
    artist: cleanNullable(entry.artist),
    genres,
    chapterCount: Math.max(0, Number(entry.stats?.chapterCount) || 0),
    lastChapterAt: normalizeDate(entry.lastChapterAddedAt),
  };
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
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
