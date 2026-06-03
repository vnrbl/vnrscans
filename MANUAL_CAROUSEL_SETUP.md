# Manual Carousel Setup Instructions

Since the CLI method has migration conflicts, let's apply the carousel migration manually.

## Steps:

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard
- Select your project
- Click on **SQL Editor** in the left sidebar

### 2. Copy and Run This SQL

Copy the ENTIRE SQL code below and paste it into the SQL Editor, then click "Run":

```sql
-- ============================================
-- SERIES CAROUSEL - MANUAL SETUP
-- ============================================

-- Check if table already exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'carousel_items'
  ) THEN
    RAISE NOTICE '⚠️  Table carousel_items already exists!';
  ELSE
    RAISE NOTICE '✓ Creating carousel_items table...';
  END IF;
END $$;

-- Create the table
CREATE TABLE IF NOT EXISTS public.carousel_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_carousel_items_position 
  ON public.carousel_items (position ASC) 
  WHERE is_active = true;

-- Create limit check function
CREATE OR REPLACE FUNCTION check_carousel_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    IF (SELECT COUNT(*) FROM public.carousel_items WHERE is_active = true AND id != COALESCE(NEW.id, gen_random_uuid())) >= 10 THEN
      RAISE EXCEPTION 'Maximum 10 active carousel items allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for limit
DROP TRIGGER IF EXISTS trigger_check_carousel_limit ON public.carousel_items;
CREATE TRIGGER trigger_check_carousel_limit
  BEFORE INSERT OR UPDATE ON public.carousel_items
  FOR EACH ROW
  EXECUTE FUNCTION check_carousel_item_limit();

-- Create timestamp update function
CREATE OR REPLACE FUNCTION update_carousel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp
DROP TRIGGER IF EXISTS trigger_update_carousel_timestamp ON public.carousel_items;
CREATE TRIGGER trigger_update_carousel_timestamp
  BEFORE UPDATE ON public.carousel_items
  FOR EACH ROW
  EXECUTE FUNCTION update_carousel_timestamp();

-- Enable RLS
ALTER TABLE public.carousel_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Active carousel items are public" ON public.carousel_items;
DROP POLICY IF EXISTS "Admins manage carousel items" ON public.carousel_items;

-- Create RLS policies
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carousel_items TO authenticated;
GRANT SELECT ON public.carousel_items TO anon;

-- Verification
DO $$ 
DECLARE
  table_exists boolean;
  policy_count int;
  trigger_count int;
BEGIN
  -- Check table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'carousel_items'
  ) INTO table_exists;
  
  -- Check policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'carousel_items';
  
  -- Check triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE event_object_table = 'carousel_items';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ CAROUSEL SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table exists: %', CASE WHEN table_exists THEN 'YES ✓' ELSE 'NO ✗' END;
  RAISE NOTICE 'RLS policies: % (expected: 2)', policy_count;
  RAISE NOTICE 'Triggers: % (expected: 2)', trigger_count;
  RAISE NOTICE '========================================';
  
  IF table_exists AND policy_count = 2 AND trigger_count = 2 THEN
    RAISE NOTICE '🎉 SUCCESS! Carousel is ready to use!';
    RAISE NOTICE 'Go to /admin/banners to add titles.';
  ELSE
    RAISE WARNING '⚠️  Setup may be incomplete. Check above.';
  END IF;
END $$;

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'carousel_items'
ORDER BY ordinal_position;
```

### 3. Check the Results

After running, you should see in the output:
- ✓ CAROUSEL SETUP COMPLETE!
- Table exists: YES ✓
- RLS policies: 2 (expected: 2)
- Triggers: 2 (expected: 2)
- 🎉 SUCCESS! Carousel is ready to use!

You should also see a table showing the columns:
- id
- series_id
- position
- is_active
- created_at
- updated_at

### 4. Test It Works

Run this quick test in the SQL Editor:

```sql
-- Test query
SELECT * FROM public.carousel_items;
```

If this returns a result (even if empty), the table exists! ✅

### 5. Go to Admin Page

Now open your app:
1. Go to `/admin/banners`
2. You should see the "Homepage Carousel" section
3. Click "Add Title (0/10)"
4. Select a series
5. Click "Add to Carousel"
6. Success! 🎉

---

## If You Get Errors

### Error: "relation 'carousel_items' already exists"
**Solution:** That's fine! It means the table is already there. Skip to step 4 to test.

### Error: "permission denied"
**Solution:** Make sure you're running this in the SQL Editor as the database owner. You should be if you're logged into the Supabase dashboard.

### Error: "no series found"
**Solution:** You need to add some titles first in Admin → Titles page.

---

## Quick Verification Checklist

- [ ] SQL ran without errors (or only "already exists" notices)
- [ ] Verification shows "SUCCESS!"
- [ ] Test query returns results
- [ ] `/admin/banners` page loads
- [ ] "Homepage Carousel" section is visible
- [ ] Dropdown shows series when clicking "Add Title"
- [ ] Can successfully add a title
- [ ] Card appears in the grid
- [ ] Homepage shows the carousel

---

**That's it! The carousel should now work perfectly.** 🚀
