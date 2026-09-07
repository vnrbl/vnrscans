-- Migration: Enable realtime publication for chapters, series, reading_history
-- and enforce at least 50% reading progress for reading history queries

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE chapters, series, reading_history;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;

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
  ORDER BY lps.updated_at DESC;
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
  JOIN public.series s ON s.id = rh.series_id
  JOIN public.chapters c ON c.id = rh.chapter_id
  WHERE rh.user_id = _user_id
    AND (_cutoff IS NULL OR rh.updated_at >= _cutoff)
    AND COALESCE(rh.progress, 0) >= 50
  ORDER BY rh.updated_at DESC
  LIMIT _limit;
$$;

-- Ensure get_series_with_latest_chapters returns the most recently created/updated chapters
CREATE OR REPLACE FUNCTION public.get_series_with_latest_chapters(limit_count INT, offset_count INT DEFAULT 0)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  cover_url TEXT,
  type TEXT,
  latest_chapter_created_at TIMESTAMPTZ,
  recent_chapters JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH series_with_latest AS (
    SELECT 
      s.id,
      s.slug,
      s.title,
      s.cover_url,
      s.type::TEXT as type,
      MAX(c.created_at) as latest_chapter_created_at
    FROM series s
    JOIN chapters c ON s.id = c.series_id
    WHERE s.is_hidden = false 
      AND (c.status = 'published' OR c.status = 'scheduled')
    GROUP BY s.id, s.slug, s.title, s.cover_url, s.type
    ORDER BY latest_chapter_created_at DESC
    LIMIT limit_count OFFSET offset_count
  )
  SELECT 
    swl.id,
    swl.slug,
    swl.title,
    swl.cover_url,
    swl.type,
    swl.latest_chapter_created_at,
    (
      SELECT COALESCE(jsonb_agg(ch), '[]'::jsonb)
      FROM (
        SELECT sub.id, sub.slug, sub.chapter_number, sub.title, sub.created_at, sub.scheduled_at, sub.status
        FROM (
          SELECT DISTINCT ON (c2.chapter_number) c2.id, c2.slug, c2.chapter_number, c2.title, c2.created_at, c2.scheduled_at, c2.status
          FROM chapters c2
          WHERE c2.series_id = swl.id AND (c2.status = 'published' OR c2.status = 'scheduled')
          ORDER BY c2.chapter_number DESC, c2.created_at DESC
        ) sub
        ORDER BY sub.created_at DESC, sub.chapter_number DESC
        LIMIT 5
      ) ch
    ) as recent_chapters
  FROM series_with_latest swl
  ORDER BY swl.latest_chapter_created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

