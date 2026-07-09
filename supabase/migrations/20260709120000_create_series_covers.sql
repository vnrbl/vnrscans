-- =============================================================
-- Migration: Create series_covers table and migrate data
-- from chapter 0 ("Covers" chapters) into it.
-- =============================================================

-- 1. Create series_covers table
CREATE TABLE IF NOT EXISTS series_covers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE series_covers ENABLE ROW LEVEL SECURITY;

-- Anyone can view series covers
CREATE POLICY "Anyone can view series covers"
  ON series_covers FOR SELECT
  USING (true);

-- Admins can manage series covers
CREATE POLICY "Admins can manage series covers"
  ON series_covers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- 3. Migrate existing data from chapter_pages of "covers" chapters
INSERT INTO series_covers (series_id, image_url, position)
SELECT c.series_id, cp.image_url, cp.page_number
FROM chapter_pages cp
JOIN chapters c ON c.id = cp.chapter_id
WHERE c.slug = 'covers' AND c.chapter_number = 0
ON CONFLICT DO NOTHING;

-- 4. Delete the "covers" chapters (cascade deletes their chapter_pages)
DELETE FROM chapters WHERE slug = 'covers' AND chapter_number = 0;
