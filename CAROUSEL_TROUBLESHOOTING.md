# Carousel Not Working - Troubleshooting Guide

## Issue: "Add title in Homepage Carousel is not working"

This guide will help you diagnose and fix the issue.

---

## Step 1: Check if Migration Was Applied

The most common issue is that the database migration hasn't been applied yet.

### Check in Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run this query:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'carousel_items'
) as table_exists;
```

**Expected Result:**
- If `table_exists` = `true` ✅ Table exists (proceed to Step 2)
- If `table_exists` = `false` ❌ Table doesn't exist (apply migration below)

### Apply the Migration

If the table doesn't exist, run this command in your terminal:

```bash
# Navigate to your project directory
cd C:\Users\manoj\Desktop\shadow-shelf

# Apply the migration using Supabase CLI
npx supabase db push
```

Or manually apply it in the Supabase SQL Editor by running the entire content of:
`supabase/migrations/20260603170000_add_series_carousel.sql`

---

## Step 2: Check Browser Console for Errors

1. Open the admin page: `/admin/banners`
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Try to add a title to carousel
5. Look for error messages (red text)

### Common Errors and Solutions

#### Error: "relation 'carousel_items' does not exist"
**Solution:** Migration not applied. See Step 1 above.

#### Error: "permission denied for table carousel_items"
**Solution:** RLS policies not set up correctly. Run this:

```sql
-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carousel_items TO authenticated;
GRANT SELECT ON public.carousel_items TO anon;
```

#### Error: "Maximum 10 active carousel items allowed"
**Solution:** You already have 10 items. Remove one first.

#### Error: "duplicate key value violates unique constraint"
**Solution:** This series is already in the carousel.

---

## Step 3: Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try to add a title
4. Look for a request to `/rest/v1/carousel_items`

### What to Check:

- **Status Code**: Should be `201 Created` for success
- **Response**: Check if there's an error message
- **Request Payload**: Verify `series_id`, `position`, `is_active` are being sent

---

## Step 4: Verify Admin Permissions

Make sure you're logged in as an admin:

```sql
-- Check your roles
SELECT ur.role 
FROM user_roles ur
WHERE ur.user_id = auth.uid();
```

**Expected Result:** Should return `admin` or `moderator`

If no roles are returned, grant admin role:

```sql
-- Replace with your user ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## Step 5: Check if Series Exist

The dropdown might be empty if there are no series in the database:

```sql
-- Check if series exist
SELECT id, title FROM public.series LIMIT 10;
```

If no series exist, you need to add some titles first in the Series management page.

---

## Step 6: Manual Testing via SQL

Try to manually insert a carousel item to test the database:

```sql
-- Get a series ID first
SELECT id, title FROM public.series LIMIT 1;

-- Insert a test carousel item (replace SERIES_ID_HERE)
INSERT INTO public.carousel_items (series_id, position, is_active)
VALUES ('SERIES_ID_HERE', 0, true);

-- Check if it was inserted
SELECT * FROM public.carousel_items;
```

If this works ✅ the issue is in the frontend code.
If this fails ❌ the issue is in the database setup.

---

## Step 7: Check Console Logs

I've added console logging to help debug. Check the browser console for:

```
Adding carousel item for series: [series-id]
Current carousel count: 0
Insert result: { data: [...], error: null }
Successfully added carousel item: [...]
```

or

```
Error adding carousel item: [error message]
```

---

## Quick Fix: Reset Everything

If nothing works, reset the carousel system:

### 1. Drop and Recreate Table

```sql
-- Drop existing table (if exists)
DROP TABLE IF EXISTS public.carousel_items CASCADE;

-- Recreate from migration file
-- Then copy/paste entire content of:
-- supabase/migrations/20260603170000_add_series_carousel.sql
```

### 2. Clear Browser Cache

- Clear cache and hard reload (Ctrl + Shift + R)
- Or open in incognito mode

### 3. Restart Dev Server

```bash
# Stop the server (Ctrl + C)
# Start again
npm run dev
```

---

## Complete Diagnostic Checklist

Run through this checklist:

- [ ] Migration file exists in `supabase/migrations/20260603170000_add_series_carousel.sql`
- [ ] Migration was applied (`carousel_items` table exists)
- [ ] RLS policies are enabled on the table
- [ ] You're logged in as admin
- [ ] Admin role is assigned to your user
- [ ] Series exist in the database
- [ ] Browser console shows no errors
- [ ] Network tab shows successful requests
- [ ] Supabase project is connected and running
- [ ] Dev server is running without errors

---

## Still Not Working?

### Get Detailed Error Info

Add this to your browser console:

```javascript
// Check if table exists
const { data, error } = await supabase
  .from('carousel_items')
  .select('*')
  .limit(1);

console.log('Table check:', { data, error });

// Try to insert
const { data: insertData, error: insertError } = await supabase
  .from('carousel_items')
  .insert({
    series_id: 'YOUR_SERIES_ID_HERE',
    position: 0,
    is_active: true
  })
  .select();

console.log('Insert test:', { insertData, insertError });
```

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Go to **Logs** → **Database Logs**
3. Look for errors when trying to insert

### Export Current State

Run this and share the output:

```sql
-- Check table structure
\d carousel_items

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'carousel_items';

-- Check triggers
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'carousel_items';

-- Check constraints
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'carousel_items';
```

---

## Most Likely Issues (In Order)

1. **Migration not applied** (90% of cases)
   - Solution: Run `npx supabase db push`

2. **No admin permissions** (5% of cases)
   - Solution: Assign admin role to your user

3. **RLS policies blocking access** (3% of cases)
   - Solution: Check and reapply RLS policies from migration

4. **No series in database** (2% of cases)
   - Solution: Add some series first

---

## Success Indicators

You'll know it's working when:

1. ✅ Dropdown shows available series
2. ✅ Clicking "Add to Carousel" shows success toast
3. ✅ Card appears in the grid with cover image
4. ✅ Position badge shows (#1, #2, etc.)
5. ✅ Counter updates (e.g., "Add Title (1/10)")
6. ✅ Homepage carousel shows the added series

---

## Need More Help?

Check the console logs I added:
- `console.log("Adding carousel item for series:", seriesId)`
- `console.log("Carousel items query result:", { data, error })`
- `console.error("Error adding carousel item:", e)`

These will show exactly what's happening and where it's failing.
