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
      AND c.status = 'published'
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
        SELECT sub.id, sub.slug, sub.chapter_number, sub.title, sub.created_at
        FROM (
          SELECT DISTINCT ON (c2.chapter_number) c2.id, c2.slug, c2.chapter_number, c2.title, c2.created_at
          FROM chapters c2
          WHERE c2.series_id = swl.id AND c2.status = 'published'
          ORDER BY c2.chapter_number DESC, c2.created_at DESC
        ) sub
        ORDER BY sub.chapter_number DESC, sub.created_at DESC
        LIMIT 5
      ) ch
    ) as recent_chapters
  FROM series_with_latest swl
  ORDER BY swl.latest_chapter_created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
