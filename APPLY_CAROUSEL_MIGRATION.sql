-- ============================================
-- CAROUSEL MIGRATION - MANUAL APPLICATION
-- ============================================
-- Copy this entire file and run it in Supabase SQL Editor
-- if 'npx supabase db push' doesn't work

-- Step 1: Check if table already exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'carousel_items'
  ) THEN
    RAISE NOTICE '⚠️  Table carousel_items already exists. Skipping creation.';
  ELSE
    RAISE NOTICE '✓ Table carousel_items does not exist. Creating...';
  END IF;
END $$;

-- Step 2: Create the table
CREATE TABLE IF NOT EXISTS public.carousel_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id)
);

-- Step 3: Create index
CREATE INDEX IF NOT EXISTS idx_carousel_items_position 
  ON public.carousel_items (position ASC) 
  WHERE is_active = true;

-- Step 4: Create limit check function
CREATE OR REPLACE FUNCTION public.check_carousel_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    IF (SELECT COUNT(*) FROM public.carousel_items WHERE is_active = true AND id != COALESCE(NEW.id, gen_random_uuid())) >= 30 THEN
      RAISE EXCEPTION 'Maximum 30 active carousel items allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for limit
DROP TRIGGER IF EXISTS trigger_check_carousel_limit ON public.carousel_items;
CREATE TRIGGER trigger_check_carousel_limit
  BEFORE INSERT OR UPDATE ON public.carousel_items
  FOR EACH ROW
  EXECUTE FUNCTION check_carousel_item_limit();

-- Step 6: Create timestamp update function
CREATE OR REPLACE FUNCTION update_carousel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for timestamp
DROP TRIGGER IF EXISTS trigger_update_carousel_timestamp ON public.carousel_items;
CREATE TRIGGER trigger_update_carousel_timestamp
  BEFORE UPDATE ON public.carousel_items
  FOR EACH ROW
  EXECUTE FUNCTION update_carousel_timestamp();

-- Step 8: Enable RLS
ALTER TABLE public.carousel_items ENABLE ROW LEVEL SECURITY;

-- Step 9: Drop existing policies (if any)
DROP POLICY IF EXISTS "Active carousel items are public" ON public.carousel_items;
DROP POLICY IF EXISTS "Admins manage carousel items" ON public.carousel_items;

-- Step 10: Create RLS policies
CREATE POLICY "Active carousel items are public" 
  ON public.carousel_items
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins manage carousel items" 
  ON public.carousel_items
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Step 11: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carousel_items TO authenticated;
GRANT SELECT ON public.carousel_items TO anon;

-- Step 12: Verification queries
DO $$ 
DECLARE
  table_count int;
  policy_count int;
  trigger_count int;
BEGIN
  -- Check table
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'carousel_items';
  
  -- Check policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'carousel_items';
  
  -- Check triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE event_object_table = 'carousel_items';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table exists: %', CASE WHEN table_count = 1 THEN '✓ YES' ELSE '✗ NO' END;
  RAISE NOTICE 'RLS policies: % (expected: 2)', policy_count;
  RAISE NOTICE 'Triggers: % (expected: 2)', trigger_count;
  RAISE NOTICE '========================================';
  
  IF table_count = 1 AND policy_count = 2 AND trigger_count = 2 THEN
    RAISE NOTICE '✓ MIGRATION SUCCESSFUL!';
  ELSE
    RAISE NOTICE '⚠️  MIGRATION MAY BE INCOMPLETE';
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- Step 13: Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'carousel_items'
ORDER BY ordinal_position;

-- Step 14: Show current carousel items count
SELECT 
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE is_active = true) as active_items,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_items
FROM public.carousel_items;

-- Done!
-- Now refresh your admin page and try adding a title to the carousel
