export type SearchSeriesLike = {
  id?: string;
  slug?: string | null;
  title?: string | null;
  alternative_titles?: string | null;
  author?: string | null;
  artist?: string | null;
  description?: string | null;
  view_count?: number | null;
  rating_average?: number | string | null;
  is_trending?: boolean | null;
  is_featured?: boolean | null;
};

export type PreparedSearch = {
  raw: string;
  normalized: string;
  terms: string[];
  tokens: string[];
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

const STOP_WORDS = new Set(["a", "an", "and", "the", "to", "of", "in", "on", "for", "with", "is"]);

export function prepareSearchInput(input: string): PreparedSearch {
  const raw = input.trim();
  const urlParts = extractTermsFromUrl(raw);
  const normalized = normalizeSearchText(raw);
  const directTerms = [normalized, slugToSearchText(raw)].filter(Boolean);
  const terms = uniqueSearchTerms(urlParts.length > 0 ? urlParts : directTerms);

  const tokens = normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  return {
    raw,
    normalized,
    terms,
    tokens,
    primaryTerm: terms[0] ?? normalized,
    isUrl: urlParts.length > 0,
  };
}

export function buildSeriesSearchOrFilter(terms: string[]): string {
  const safeTerms = terms
    .map(sanitizeSupabasePattern)
    .filter((term) => term.length >= 2);

  const clauses: string[] = [];

  for (const term of safeTerms) {
    clauses.push(`title.ilike.%${term}%`);
    clauses.push(`alternative_titles.ilike.%${term}%`);
    clauses.push(`slug.ilike.%${slugifySearchTerm(term)}%`);
    clauses.push(`author.ilike.%${term}%`);
    clauses.push(`artist.ilike.%${term}%`);
  }

  // Also include individual token matching if multiple words
  if (terms.length > 0 && terms[0].includes(" ")) {
    const words = terms[0]
      .split(" ")
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
    for (const w of words) {
      clauses.push(`title.ilike.%${sanitizeSupabasePattern(w)}%`);
    }
  }

  return Array.from(new Set(clauses)).join(",");
}

export function rankSeriesResults<T extends SearchSeriesLike>(
  items: T[],
  prepared: PreparedSearch
): T[] {
  const terms = prepared.terms.length > 0 ? prepared.terms : [prepared.normalized].filter(Boolean);
  if (terms.length === 0) return items;

  return [...items]
    .map((item) => ({ item, score: scoreSeriesResult(item, terms, prepared.tokens) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const bRating = Number(b.item.rating_average || 0);
      const aRating = Number(a.item.rating_average || 0);
      if (bRating !== aRating) return bRating - aRating;
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
      .replace(/[-_+.]+/g, " ")
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

function scoreSeriesResult(
  item: SearchSeriesLike,
  terms: string[],
  tokens: string[] = []
): number {
  const title = normalizeSearchText(item.title ?? "");
  const slug = normalizeSearchText((item.slug ?? "").replace(/-/g, " "));
  const alternativeTitles = normalizeSearchText(item.alternative_titles ?? "");
  const author = normalizeSearchText(item.author ?? "");
  const artist = normalizeSearchText(item.artist ?? "");
  const description = normalizeSearchText(item.description ?? "");

  let score = 0;
  if (item.is_trending) score += 10;
  if (item.is_featured) score += 15;
  if (item.rating_average) score += Number(item.rating_average) * 2;

  for (const term of terms) {
    if (!term) continue;

    // Exact Title Match (Highest Priority)
    if (title === term) score += 1000;
    else if (title.startsWith(term)) score += 500;
    else if (title.includes(` ${term} `) || title.startsWith(`${term} `) || title.endsWith(` ${term}`)) score += 300;
    else if (title.includes(term)) score += 180;

    // Slug Matches
    if (slug === term) score += 800;
    else if (slug.startsWith(term)) score += 400;
    else if (slug.includes(term)) score += 150;

    // Alternative Title Matches
    if (alternativeTitles === term) score += 600;
    else if (alternativeTitles.startsWith(term)) score += 300;
    else if (alternativeTitles.includes(term)) score += 140;

    // Author / Artist
    if (author === term || artist === term) score += 200;
    else if (author.includes(term) || artist.includes(term)) score += 80;

    // Description match
    if (description.includes(term)) score += 25;
  }

  // Multi-Token Precision Check
  if (tokens.length > 1) {
    const matchedTitleTokens = tokens.filter((tok) => title.includes(tok) || slug.includes(tok));
    if (matchedTitleTokens.length === tokens.length) {
      score += 400; // All tokens present in title!
    } else {
      score += matchedTitleTokens.length * 50;
    }
  }

  return score;
}
