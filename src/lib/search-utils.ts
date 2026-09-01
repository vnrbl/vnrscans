export type SearchSeriesLike = {
  slug?: string | null;
  title?: string | null;
  alternative_titles?: string | null;
  author?: string | null;
  artist?: string | null;
  description?: string | null;
  view_count?: number | null;
  is_trending?: boolean | null;
};

export type PreparedSearch = {
  raw: string;
  normalized: string;
  terms: string[];
  primaryTerm: string;
  isUrl: boolean;
};

const GENERIC_PATH_SEGMENTS = new Set([
  "title",
  "series",
  "manga",
  "manhwa",
  "manhua",
  "comic",
  "comics",
  "read",
  "reader",
  "chapter",
  "chapters",
]);

const STOP_WORDS = new Set(["a", "an", "and", "the", "to", "of", "in", "on", "for", "with"]);

export function prepareSearchInput(input: string): PreparedSearch {
  const raw = input.trim();
  const urlParts = extractTermsFromUrl(raw);
  const normalized = normalizeSearchText(raw);
  const directTerms = [normalized, slugToSearchText(raw)].filter(Boolean);
  const terms = uniqueSearchTerms(urlParts.length > 0 ? urlParts : directTerms);

  return {
    raw,
    normalized,
    terms,
    primaryTerm: terms[0] ?? normalized,
    isUrl: urlParts.length > 0,
  };
}

export function buildSeriesSearchOrFilter(terms: string[]): string {
  const safeTerms = terms.map(sanitizeSupabasePattern).filter((term) => term.length >= 2);
  const clauses = safeTerms.flatMap((term) => [
    `title.ilike.%${term}%`,
    `alternative_titles.ilike.%${term}%`,
    `author.ilike.%${term}%`,
    `artist.ilike.%${term}%`,
    `description.ilike.%${term}%`,
    `slug.ilike.%${slugifySearchTerm(term)}%`,
  ]);

  return clauses.join(",");
}

export function rankSeriesResults<T extends SearchSeriesLike>(items: T[], prepared: PreparedSearch): T[] {
  const terms = prepared.terms.length > 0 ? prepared.terms : [prepared.normalized].filter(Boolean);
  if (terms.length === 0) return items;

  return [...items]
    .map((item) => ({ item, score: scoreSeriesResult(item, terms) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Number(b.item.view_count ?? 0) - Number(a.item.view_count ?? 0);
    })
    .map(({ item }) => item);
}

export function getSearchDisplayTerm(input: string): string {
  const prepared = prepareSearchInput(input);
  return prepared.primaryTerm || prepared.normalized || prepared.raw;
}

function extractTermsFromUrl(input: string): string[] {
  const parsed = parsePossibleUrl(input);
  if (!parsed) return [];

  const pathSegments = parsed.pathname
    .split("/")
    .map((part) => decodeURIComponent(part).trim())
    .filter(Boolean);

  const usefulSegments = pathSegments.filter((part) => {
    const lower = part.toLowerCase();
    return !GENERIC_PATH_SEGMENTS.has(lower) && !/^chapter[-_\s]?\d+(?:\.\d+)?$/i.test(lower);
  });

  const titleSlug =
    usefulSegments.find((part) => /[a-z]/i.test(part) && part.includes("-")) ??
    usefulSegments.find((part) => /[a-z]/i.test(part));

  const terms = [
    titleSlug ? slugToSearchText(titleSlug) : "",
    ...usefulSegments.map(slugToSearchText),
    parsed.searchParams.get("q") ?? "",
    parsed.searchParams.get("search") ?? "",
    parsed.searchParams.get("title") ?? "",
  ];

  return uniqueSearchTerms(terms);
}

function parsePossibleUrl(input: string): URL | null {
  if (!input) return null;

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) {
    if (/^(?:localhost|127\.0\.0\.1|\[?::1\]?)(?::\d+)?(?:\/|$)/i.test(input)) {
      try {
        return new URL(`http://${input}`);
      } catch {
        return null;
      }
    }

    if (/^[\w.-]+\.[a-z]{2,}(?:\/|$)/i.test(input)) {
      try {
        return new URL(`https://${input}`);
      } catch {
        return null;
      }
    }
  }

  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function slugToSearchText(value: string): string {
  return normalizeSearchText(
    value
      .replace(/^https?:\/\//i, "")
      .replace(/\.[a-z0-9]{2,5}(?:[?#].*)?$/i, "")
      .replace(/[-_+.]+/g, " "),
  );
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^https?:\/\//i, "")
    .replace(/[^\p{L}\p{N}\s'-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function uniqueSearchTerms(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const normalized = normalizeSearchText(value);
    if (normalized.length < 2 || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);

    const withoutStops = normalized
      .split(" ")
      .filter((word) => !STOP_WORDS.has(word))
      .join(" ");
    if (withoutStops.length >= 2 && !seen.has(withoutStops)) {
      seen.add(withoutStops);
      output.push(withoutStops);
    }
  }

  return output.slice(0, 5);
}

function sanitizeSupabasePattern(value: string): string {
  return value.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
}

function slugifySearchTerm(value: string): string {
  return sanitizeSupabasePattern(value).replace(/\s+/g, "-").toLowerCase();
}

function scoreSeriesResult(item: SearchSeriesLike, terms: string[]): number {
  const title = normalizeSearchText(item.title ?? "");
  const slug = normalizeSearchText((item.slug ?? "").replace(/-/g, " "));
  const alternativeTitles = normalizeSearchText(item.alternative_titles ?? "");
  const author = normalizeSearchText(item.author ?? "");
  const artist = normalizeSearchText(item.artist ?? "");
  const description = normalizeSearchText(item.description ?? "");

  let score = item.is_trending ? 4 : 0;

  for (const term of terms) {
    if (!term) continue;
    if (title === term) score += 120;
    if (slug === term) score += 110;
    if (title.startsWith(term)) score += 70;
    if (slug.startsWith(term)) score += 60;
    if (title.includes(term)) score += 45;
    if (slug.includes(term)) score += 40;
    if (alternativeTitles.includes(term)) score += 30;
    if (author.includes(term) || artist.includes(term)) score += 18;
    if (description.includes(term)) score += 6;

    const words = term.split(" ").filter((word) => word.length > 1);
    const matchedTitleWords = words.filter((word) => title.includes(word) || slug.includes(word)).length;
    score += matchedTitleWords * 8;
  }

  return score;
}
