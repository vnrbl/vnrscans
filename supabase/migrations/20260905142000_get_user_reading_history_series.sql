-- Migration: Add RPC to fetch a user's reading history grouped by series accurately
-- Returns the most recent chapter read for each series, preventing truncation when a user
-- has read many chapters in a single series.

CREATE OR REPLACE FUNCTION public.get_user_reading_history_series(
  _user_id UUID,
  _cutoff TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  updated_at TIMESTAMPTZ,
  progress NUMERIC,
  series_id UUID,
  series_slug TEXT,
  series_title TEXT,
  series_cover_url TEXT,
  chapter_id UUID,
  chapter_slug TEXT,
  chapter_number NUMERIC,
  chapter_title TEXT
) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH latest_per_series AS (
    SELECT DISTINCT ON (rh.series_id)
      rh.id,
      rh.updated_at,
      rh.progress,
      rh.series_id,
      rh.chapter_id
    FROM public.reading_history rh
    WHERE rh.user_id = _user_id
      AND (_cutoff IS NULL OR rh.updated_at >= _cutoff)
    ORDER BY rh.series_id, rh.updated_at DESC
  )
  SELECT
    lps.id,
    lps.updated_at,
    lps.progress,
    s.id AS series_id,
    s.slug AS series_slug,
    s.title AS series_title,
    s.cover_url AS series_cover_url,
    c.id AS chapter_id,
    c.slug AS chapter_slug,
    c.chapter_number,
    c.title AS chapter_title
  FROM latest_per_series lps
  JOIN public.series s ON s.id = lps.series_id
  JOIN public.chapters c ON c.id = lps.chapter_id
  ORDER BY lps.updated_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_user_reading_history_series(UUID, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_reading_history_series(UUID, TIMESTAMPTZ) TO anon, authenticated, service_role;
