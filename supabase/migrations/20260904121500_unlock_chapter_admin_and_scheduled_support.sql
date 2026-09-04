-- Migration: Add scheduled_at to get_series_with_latest_chapters, allow public read of scheduled chapter metadata, and add admin_unlock_chapter RPC

-- 1. Replace get_series_with_latest_chapters to include scheduled_at in recent_chapters json
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
        SELECT sub.id, sub.slug, sub.chapter_number, sub.title, sub.created_at, sub.scheduled_at
        FROM (
          SELECT DISTINCT ON (c2.chapter_number) c2.id, c2.slug, c2.chapter_number, c2.title, c2.created_at, c2.scheduled_at
          FROM chapters c2
          WHERE c2.series_id = swl.id AND (c2.status = 'published' OR c2.status = 'scheduled')
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

-- 2. Allow public to read chapter metadata for published and scheduled chapters
-- so readers can see countdown timers and info even before early-access unlock
DROP POLICY IF EXISTS "chapters public read" ON public.chapters;
CREATE POLICY "chapters public read" ON public.chapters FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR status = 'scheduled'
    OR public.has_role(auth.uid(), 'admin')
  );

-- 3. Ensure chapter_pages RLS policy allows admin preview and unlocks pages when scheduled_at <= now()
DROP POLICY IF EXISTS "chapter_pages public read" ON public.chapter_pages;
CREATE POLICY "chapter_pages public read" ON public.chapter_pages FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters c
      WHERE c.id = chapter_pages.chapter_id
        AND (c.status = 'published' OR c.status = 'scheduled')
        AND (c.scheduled_at IS NULL OR c.scheduled_at <= now())
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Admin RPC to unlock a chapter immediately
CREATE OR REPLACE FUNCTION public.admin_unlock_chapter(_chapter_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators or moderators can unlock chapters.';
  END IF;

  UPDATE public.chapters
  SET scheduled_at = NULL,
      status = 'published',
      updated_at = NOW()
  WHERE id = _chapter_id;

  RETURN TRUE;
END;
$$;
