-- Allow multiple chapters with the same number when scanlation_group differs

ALTER TABLE public.chapters
  DROP CONSTRAINT IF EXISTS chapters_series_id_chapter_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS chapters_series_number_group_key
  ON public.chapters (series_id, chapter_number, COALESCE(scanlation_group, ''));
