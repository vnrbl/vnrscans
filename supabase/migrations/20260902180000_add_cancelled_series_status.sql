-- Migration to safely allow 'cancelled' in series_status enum if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = 'series_status' AND pg_enum.enumlabel = 'cancelled'
  ) THEN
    ALTER TYPE public.series_status ADD VALUE 'cancelled';
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
