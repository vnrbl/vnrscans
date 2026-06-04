-- Public reading history for profile pages.
-- Exposes only published, non-hidden chapter metadata when the profile owner
-- has opted into showing reading history.

CREATE OR REPLACE FUNCTION public.get_public_reading_history(
  _profile_user_id uuid,
  _limit integer DEFAULT 12
)
RETURNS TABLE (
  history_id uuid,
  updated_at timestamptz,
  series_id uuid,
  series_slug text,
  series_title text,
  series_cover_url text,
  chapter_id uuid,
  chapter_slug text,
  chapter_number numeric,
  chapter_title text,
  progress numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    rh.id AS history_id,
    rh.updated_at,
    s.id AS series_id,
    s.slug AS series_slug,
    s.title AS series_title,
    s.cover_url AS series_cover_url,
    c.id AS chapter_id,
    c.slug AS chapter_slug,
    c.chapter_number,
    c.title AS chapter_title,
    rh.progress
  FROM public.profiles p
  JOIN public.reading_history rh
    ON rh.user_id = p.user_id
  JOIN public.chapters c
    ON c.id = rh.chapter_id
  JOIN public.series s
    ON s.id = rh.series_id
  WHERE p.user_id = _profile_user_id
    AND p.profile_visibility = 'public'
    AND COALESCE(p.show_reading_history, true) = true
    AND c.status = 'published'
    AND COALESCE(s.is_hidden, false) = false
  ORDER BY rh.updated_at DESC
  LIMIT GREATEST(0, LEAST(COALESCE(_limit, 12), 50));
$$;

REVOKE ALL ON FUNCTION public.get_public_reading_history(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_reading_history(uuid, integer) TO anon, authenticated;
