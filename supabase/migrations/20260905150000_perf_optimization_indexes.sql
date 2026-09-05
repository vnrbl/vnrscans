-- ============================================================================
-- Performance Optimization Indexes
-- Target queries:
-- 1. Chapter lookup by slug in reader: chapters(slug)
-- 2. Sibling / published chapters by series: chapters(series_id, chapter_number DESC)
-- 3. Reading history ordered by updated_at: reading_history(user_id, updated_at DESC)
-- 4. Series catalog sorting by updated_at: series(updated_at DESC)
-- 5. Fuzzy text search on series titles: pg_trgm GIN index
-- ============================================================================

-- 1. Index on chapter slug (fixes sequential full-table scan on /title/[slug]/[chapterSlug])
CREATE INDEX IF NOT EXISTS idx_chapters_slug 
  ON public.chapters(slug);

-- 2. Index on published chapters per series ordered by chapter_number
CREATE INDEX IF NOT EXISTS idx_chapters_series_published_num 
  ON public.chapters(series_id, chapter_number DESC) 
  WHERE status = 'published';

-- 3. Index on user reading history for fast history retrieval
CREATE INDEX IF NOT EXISTS idx_reading_history_user_updated 
  ON public.reading_history(user_id, updated_at DESC);

-- 4. Index on non-hidden series by updated_at for homepage and browse catalog
CREATE INDEX IF NOT EXISTS idx_series_visible_updated 
  ON public.series(updated_at DESC) 
  WHERE is_hidden = false;

-- 5. Enable pg_trgm extension if available and create trigram index for fast title search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_series_title_trgm 
  ON public.series USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_series_alt_titles_trgm 
  ON public.series USING gin(alternative_titles gin_trgm_ops);
