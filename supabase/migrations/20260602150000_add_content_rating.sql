-- Add content rating enum and column to series table
CREATE TYPE public.content_rating AS ENUM ('safe', 'suggestive', 'nsfw', 'pornographic');

ALTER TABLE public.series 
ADD COLUMN content_rating public.content_rating NOT NULL DEFAULT 'safe';

-- Create index for filtering
CREATE INDEX series_content_rating_idx ON public.series(content_rating);
