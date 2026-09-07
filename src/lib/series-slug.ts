import { supabase } from "@/integrations/supabase/client";

/**
 * Safely decode URL slugs, handling percent-encoding like %3A, %27, etc.
 */
export function safeDecodeSlug(slug: string): string {
  if (!slug) return "";
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/**
 * Robust server and client series resolver by slug.
 * Handles:
 * - URL encoded slugs (%3A, %27, etc.)
 * - Unencoded slugs with colons, hyphens, or apostrophes
 * - Case-insensitive matches (e.g. capitalized URLs)
 * - Normalized words fallback (e.g. slug without punctuation)
 */
export async function fetchSeriesBySlug(
  rawSlug: string,
  selectQuery: string = "*,series_genres(genre:genres(id,name,slug)),series_tags(tag:tags(id,name,slug,color,icon))"
): Promise<any> {
  if (!rawSlug) return null;
  const decoded = safeDecodeSlug(rawSlug);

  // 1. Direct candidate matching
  const candidates = Array.from(
    new Set([rawSlug, decoded, rawSlug.toLowerCase(), decoded.toLowerCase()].filter(Boolean))
  );

  const { data: directMatch } = await supabase
    .from("series")
    .select(selectQuery as any)
    .in("slug", candidates)
    .limit(1)
    .maybeSingle();

  if (directMatch) return directMatch;

  // 2. Case-insensitive exact match
  const { data: ilikeMatch } = await supabase
    .from("series")
    .select(selectQuery as any)
    .ilike("slug", decoded)
    .limit(1)
    .maybeSingle();

  if (ilikeMatch) return ilikeMatch;

  // 3. Words-based fuzzy fallback for altered punctuation
  const words = decoded.split(/[^a-z0-9]/i).filter((w) => w.length > 2);
  if (words.length >= 2) {
    const pattern = `%${words.slice(0, 3).join("%")}%`;
    const { data: fuzzyMatches } = await supabase
      .from("series")
      .select(selectQuery as any)
      .ilike("slug", pattern)
      .limit(10);

    if (fuzzyMatches && fuzzyMatches.length > 0) {
      const normalizedTarget = decoded.replace(/[^a-z0-9]/gi, "").toLowerCase();
      const match =
        fuzzyMatches.find(
          (s: any) =>
            s.slug &&
            s.slug.replace(/[^a-z0-9]/gi, "").toLowerCase() === normalizedTarget
        ) || fuzzyMatches[0];
      if (match) return match;
    }
  }

  return null;
}
