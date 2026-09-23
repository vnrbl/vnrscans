-- Keep privileged database-wide cleanup out of the public Supabase RPC surface.
REVOKE ALL ON FUNCTION public.cleanup_old_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_data() TO service_role;

-- The profile UI can request reading history by user ID, so enforce its privacy
-- settings inside the SECURITY DEFINER functions rather than relying on the UI.
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
  WITH visible_profile AS (
    SELECT p.user_id
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND (
        auth.uid() = _user_id
        OR (p.profile_visibility = 'public' AND COALESCE(p.show_reading_history, true))
      )
  ),
  latest_per_series AS (
    SELECT DISTINCT ON (rh.series_id)
      rh.id,
      rh.updated_at,
      rh.progress,
      rh.series_id,
      rh.chapter_id
    FROM public.reading_history rh
    JOIN visible_profile vp ON vp.user_id = rh.user_id
    WHERE (_cutoff IS NULL OR rh.updated_at >= _cutoff)
      AND COALESCE(rh.progress, 0) >= 50
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
  ORDER BY lps.updated_at DESC
  LIMIT 1000;
$$;

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
  JOIN public.profiles p ON p.user_id = rh.user_id
  JOIN public.series s ON s.id = rh.series_id
  JOIN public.chapters c ON c.id = rh.chapter_id
  WHERE rh.user_id = _user_id
    AND (_cutoff IS NULL OR rh.updated_at >= _cutoff)
    AND COALESCE(rh.progress, 0) >= 50
    AND (
      auth.uid() = _user_id
      OR (p.profile_visibility = 'public' AND COALESCE(p.show_reading_history, true))
    )
  ORDER BY rh.updated_at DESC
  LIMIT GREATEST(0, LEAST(COALESCE(_limit, 1000), 1000));
$$;
