# Verify Carousel Setup

## Quick Verification Steps

### 1. Check if Table Exists (Supabase Dashboard)

Go to: **Supabase Dashboard → SQL Editor**

Run this query:
```sql
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'carousel_items'
  ) as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'carousel_items') as column_count;
```

**Expected Output:**
- `table_exists`: true
- `column_count`: 5 (id, series_id, position, is_active, created_at, updated_at)

### 2. If Table Doesn't Exist

**Option A: Using Supabase CLI** (Recommended)
```bash
cd C:\Users\manoj\Desktop\shadow-shelf
npx supabase db push
```

**Option B: Manual SQL** (Copy entire file content)
1. Open `supabase/migrations/20260603170000_add_series_carousel.sql`
2. Copy all content
3. Paste in Supabase SQL Editor
4. Click "Run"

### 3. Verify RLS Policies

```sql
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'carousel_items';
```

**Expected Output:** 2 policies
- `Active carousel items are public` (SELECT)
- `Admins manage carousel items` (ALL)

### 4. Test Insert Permission

```sql
-- This should work if you're admin
INSERT INTO public.carousel_items (series_id, position, is_active)
SELECT id, 0, true 
FROM public.series 
LIMIT 1
RETURNING *;
```

If successful ✅ you'll see the inserted row.
If error ❌ check the error message.

### 5. Verify Your Admin Role

```sql
SELECT 
  p.email,
  ur.role
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE au.id = auth.uid();
```

**Expected:** Role should be `admin` or `moderator`

### 6. Check Browser Console

1. Open `/admin/banners` page
2. Press F12 to open DevTools
3. Go to Console tab
4. You should see:
   - `Fetching carousel items...`
   - `Carousel items query result: { data: [...], error: null }`

If you see errors, the table might not exist or RLS is blocking.

### 7. Test the Add Function

Open browser console and run:
```javascript
// Get first series ID
const { data: series } = await supabase.from('series').select('id').limit(1);
const seriesId = series[0].id;

// Try to insert carousel item
const { data, error } = await supabase
  .from('carousel_items')
  .insert({ series_id: seriesId, position: 0, is_active: true })
  .select();

console.log('Manual insert test:', { data, error });
```

If this works but the button doesn't, the issue is in the UI code.

---

## Common Issues & Fixes

### Issue: "relation 'carousel_items' does not exist"
**Fix:** Run the migration (see Step 2 above)

### Issue: "permission denied for table carousel_items"
**Fix:** 
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carousel_items TO authenticated;
GRANT SELECT ON public.carousel_items TO anon;
```

### Issue: "Maximum 10 active carousel items allowed"
**Fix:** You already have 10 items. Remove one:
```sql
DELETE FROM public.carousel_items 
WHERE id = (SELECT id FROM public.carousel_items LIMIT 1);
```

### Issue: "null value in column 'series_id' violates not-null constraint"
**Fix:** Make sure you selected a series from dropdown before clicking Add

### Issue: Dropdown is empty
**Fix:** No series available. Check:
```sql
SELECT COUNT(*) FROM public.series;
```
If 0, add some series first in Admin → Titles

---

## Success Checklist

Your setup is working correctly when:

- [x] Table `carousel_items` exists
- [x] 5 columns in the table
- [x] 2 RLS policies active
- [x] Trigger `trigger_check_carousel_limit` exists
- [x] Your user has `admin` or `moderator` role
- [x] Series exist in database
- [x] Console shows no errors when loading page
- [x] Dropdown shows available series
- [x] Add button works without errors
- [x] Success toast appears after adding
- [x] Card appears in grid
- [x] Homepage carousel shows the series

---

## If Everything Fails

Last resort - Reset the entire carousel system:

```sql
-- 1. Drop existing table
DROP TABLE IF EXISTS public.carousel_items CASCADE;

-- 2. Drop triggers
DROP TRIGGER IF EXISTS trigger_check_carousel_limit ON public.carousel_items;
DROP TRIGGER IF EXISTS trigger_update_carousel_timestamp ON public.carousel_items;

-- 3. Drop functions
DROP FUNCTION IF EXISTS check_carousel_item_limit();
DROP FUNCTION IF EXISTS update_carousel_timestamp();

-- 4. Now run the entire migration file content:
-- Copy from: supabase/migrations/20260603170000_add_series_carousel.sql
-- Paste here and run
```

Then refresh the admin page and try again.
