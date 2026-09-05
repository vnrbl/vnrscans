-- Migration: Add RPC to fetch all user reading history chapters with proper joins
CREATE OR REPLACE FUNCTION public.get_user_reading_history_chapters(
  _user_id UUID,
  _cutoff TIMESTAMPTZ DEFAULT NULL,
  _limit INT DEFAULT 1000
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
  SELECT
    rh.id,
    rh.updated_at,
    rh.progress,
    s.id AS series_id,
    s.slug AS series_slug,
    s.title AS series_title,
    s.cover_url AS series_cover_url,
    c.id AS chapter_id,
    c.slug AS chapter_slug,
    c.chapter_number,
    c.title AS chapter_title
  FROM public.reading_history rh
  JOIN public.series s ON s.id = rh.series_id
  JOIN public.chapters c ON c.id = rh.chapter_id
  WHERE rh.user_id = _user_id
    AND (_cutoff IS NULL OR rh.updated_at >= _cutoff)
  ORDER BY rh.updated_at DESC
  LIMIT _limit;
$$;

REVOKE ALL ON FUNCTION public.get_user_reading_history_chapters(UUID, TIMESTAMPTZ, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_reading_history_chapters(UUID, TIMESTAMPTZ, INT) TO anon, authenticated, service_role;
