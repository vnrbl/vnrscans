-- Public aggregate profile stats.
-- Keeps row-level privacy on reading_history/user_achievements while exposing
-- only counts when the profile owner has opted in.

CREATE OR REPLACE FUNCTION public.get_public_profile_stats(_profile_user_id uuid)
RETURNS TABLE (
  chapters_read bigint,
  series_followed bigint,
  achievements_unlocked bigint,
  show_reading_history boolean,
  show_achievements boolean,
  show_statistics boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH profile_settings AS (
    SELECT
      p.user_id,
      p.profile_visibility,
      COALESCE(p.show_reading_history, true) AS show_reading_history,
      COALESCE(p.show_achievements, true) AS show_achievements,
      COALESCE(p.show_statistics, true) AS show_statistics
    FROM public.profiles p
    WHERE p.user_id = _profile_user_id
      AND p.profile_visibility = 'public'
    LIMIT 1
  )
  SELECT
    CASE
      WHEN ps.show_reading_history THEN (
        SELECT COUNT(*)
        FROM public.reading_history rh
        WHERE rh.user_id = ps.user_id
      )
      ELSE 0
    END AS chapters_read,
    CASE
      WHEN ps.show_reading_history THEN (
        SELECT COUNT(*)
        FROM public.user_library ul
        WHERE ul.user_id = ps.user_id
      )
      ELSE 0
    END AS series_followed,
    CASE
      WHEN ps.show_achievements THEN (
        SELECT COUNT(*)
        FROM public.user_achievements ua
        WHERE ua.user_id = ps.user_id
      )
      ELSE 0
    END AS achievements_unlocked,
    ps.show_reading_history,
    ps.show_achievements,
    ps.show_statistics
  FROM profile_settings ps;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_stats(uuid) TO anon, authenticated;
