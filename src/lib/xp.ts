// Single source of truth for XP amounts and source-label rendering. Must match
// the values in supabase/migrations/20260615000000_xp_history_and_sources.sql —
// the server is authoritative; these are only for "how much will I earn" hints.

export const XP_AMOUNTS = {
  chapter_complete: 1000,
  caught_up: 100,
  series_complete: 1000,
  follow_series: 15,
  comment: 25,
  rate_series: 50,
} as const;

export type XpSource = keyof typeof XP_AMOUNTS | "summary" | string;

export const XP_SOURCE_LABELS: Record<string, string> = {
  chapter_complete: "Chapter read",
  caught_up: "Caught up to latest",
  series_complete: "Finished title",
  follow_series: "Added to library",
  comment: "Comment posted",
  rate_series: "Rated series",
};

export function xpSourceLabel(source: string): string {
  return XP_SOURCE_LABELS[source] ?? source.replace(/_/g, " ");
}
