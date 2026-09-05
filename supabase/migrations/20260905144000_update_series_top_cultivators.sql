-- Migration: Update get_series_top_cultivators to rank by Qi gathered from this series
-- and return total_user_qi along with series_qi_collected. Disambiguate column references.

DROP FUNCTION IF EXISTS public.get_series_top_cultivators(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.get_series_top_cultivators(_series_id UUID, _limit INTEGER DEFAULT 5)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  avatar_frame TEXT,
  accent_color TEXT,
  user_level INTEGER,
  total_user_qi BIGINT,
  series_qi_collected BIGINT,
  chapters_read BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH series_chapter_ids AS (
    SELECT c.id FROM public.chapters c WHERE c.series_id = _series_id
  ),
  user_history_stats AS (
    SELECT
      rh.user_id,
      count(DISTINCT rh.chapter_id) AS ch_count
    FROM public.reading_history rh
    WHERE rh.series_id = _series_id
      AND (rh.progress >= 70 OR rh.xp_awarded = true)
    GROUP BY rh.user_id
  ),
  user_trans_stats AS (
    SELECT
      t.user_id,
      coalesce(sum(t.amount), 0) AS trans_qi
    FROM public.xp_transactions t
    WHERE (
      (t.reference_type = 'chapter' AND t.reference_id IN (SELECT id FROM series_chapter_ids))
      OR (t.reference_type = 'series' AND t.reference_id = _series_id)
    )
    GROUP BY t.user_id
  ),
  combined_users AS (
    SELECT uhs.user_id FROM user_history_stats uhs
    UNION
    SELECT uts.user_id FROM user_trans_stats uts
  ),
  ranked_users AS (
    SELECT
      cu.user_id,
      coalesce(uhs.ch_count, 0)::BIGINT AS ch_read,
      greatest(
        coalesce(uts.trans_qi, 0)::BIGINT,
        (coalesce(uhs.ch_count, 0) * 50)::BIGINT
      ) AS total_series_qi
    FROM combined_users cu
    LEFT JOIN user_history_stats uhs ON uhs.user_id = cu.user_id
    LEFT JOIN user_trans_stats uts ON uts.user_id = cu.user_id
  )
  SELECT
    p.user_id,
    coalesce(p.username, 'Cultivator')::TEXT AS username,
    p.avatar_url::TEXT,
    p.avatar_frame::TEXT,
    p.accent_color::TEXT,
    coalesce(p.user_level, 1)::INTEGER AS user_level,
    coalesce(p.experience_points, 0)::BIGINT AS total_user_qi,
    r.total_series_qi AS series_qi_collected,
    r.ch_read AS chapters_read
  FROM ranked_users r
  JOIN public.profiles p ON p.user_id = r.user_id
  WHERE r.total_series_qi > 0 OR r.ch_read > 0
  ORDER BY r.total_series_qi DESC, r.ch_read DESC
  LIMIT coalesce(_limit, 5);
$$;

REVOKE ALL ON FUNCTION public.get_series_top_cultivators(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_series_top_cultivators(UUID, INTEGER) TO anon, authenticated, service_role;
