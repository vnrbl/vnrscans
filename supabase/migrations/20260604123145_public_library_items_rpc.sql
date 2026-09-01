-- Public library items for profile pages.
-- Exposes only series metadata from user_library when the profile owner has
-- opted into showing libraries on their public profile.

CREATE OR REPLACE FUNCTION public.get_public_library_items(
  _profile_user_id uuid,
  _limit integer DEFAULT 12
)
RETURNS TABLE (
  library_id uuid,
  updated_at timestamptz,
  reading_status public.reading_status,
  series_id uuid,
  series_slug text,
  series_title text,
  series_cover_url text,
  series_type public.series_type,
  series_status public.series_status,
  rating_average numeric,
  view_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    ul.id AS library_id,
    ul.updated_at,
    ul.reading_status,
    s.id AS series_id,
    s.slug AS series_slug,
    s.title AS series_title,
    s.cover_url AS series_cover_url,
    s.type AS series_type,
    s.status AS series_status,
    s.rating_average,
    s.view_count
  FROM public.profiles p
  JOIN public.user_library ul
    ON ul.user_id = p.user_id
  JOIN public.series s
    ON s.id = ul.series_id
  WHERE p.user_id = _profile_user_id
    AND p.profile_visibility = 'public'
    AND COALESCE(p.show_reading_history, true) = true
    AND COALESCE(s.is_hidden, false) = false
  ORDER BY ul.updated_at DESC
  LIMIT GREATEST(0, LEAST(COALESCE(_limit, 12), 50));
$$;

REVOKE ALL ON FUNCTION public.get_public_library_items(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_library_items(uuid, integer) TO anon, authenticated;
