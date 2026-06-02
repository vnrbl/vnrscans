-- Add chapter_count column to series table
ALTER TABLE series 
ADD COLUMN IF NOT EXISTS chapter_count integer DEFAULT 0;

-- Add comment
COMMENT ON COLUMN series.chapter_count IS 'Manual override for chapter count display';

-- Create index for sorting/filtering by chapter count
CREATE INDEX IF NOT EXISTS idx_series_chapter_count ON series(chapter_count);