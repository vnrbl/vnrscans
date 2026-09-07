-- Add shared universe and universe role to series table
ALTER TABLE public.series 
ADD COLUMN IF NOT EXISTS universe TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS universe_role TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_series_universe ON public.series(universe) WHERE universe IS NOT NULL;
