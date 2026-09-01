-- Add uploader and scanlation group fields to chapters table
ALTER TABLE chapters
ADD COLUMN IF NOT EXISTS uploaded_by text,
ADD COLUMN IF NOT EXISTS scanlation_group text;

-- Add index for filtering by scanlation group
CREATE INDEX IF NOT EXISTS idx_chapters_scanlation_group ON chapters(scanlation_group);

-- Add comment
COMMENT ON COLUMN chapters.uploaded_by IS 'Name or username of the person who uploaded the chapter';
COMMENT ON COLUMN chapters.scanlation_group IS 'Name of the scanlation/translation group';
