# Notification System Troubleshooting

## 🔍 Step-by-Step Debugging

### Step 1: Run the Debug Script

**In Supabase SQL Editor**, run: `debug_notifications.sql`

This will check:
- ✅ If tables exist
- ✅ If trigger is enabled
- ✅ Your user ID
- ✅ Series you're following
- ✅ Create a test notification
- ✅ RLS policies

**Expected Output**: You should see a test notification created

---

### Step 2: Check Browser Console

1. Open your app in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for any errors related to notifications

**Common errors**:
- "Error fetching notifications" → RLS policy issue
- "user_notifications does not exist" → Migration not applied
- No errors but no bell icon → Component not imported

---

### Step 3: Verify Component is Loaded

**Check**:
1. Look at navbar - do you see the bell icon?
2. If NO bell icon:
   - Check `src/components/Navbar.tsx`
   - Verify `<NotificationBell />` is present
   - Check for import errors in console

**To verify**:
```typescript
// In Navbar.tsx, should have:
import { NotificationBell } from "@/components/notifications/NotificationBell";

// And in JSX:
<NotificationBell />
```

---

### Step 4: Manual Notification Test

Run this SQL in Supabase:

```sql
-- Get your user ID first
SELECT auth.uid() as my_user_id;

-- Then insert a test notification (replace YOUR_USER_ID)
INSERT INTO user_notifications (
  user_id,
  notification_type,
  title,
  message,
  link_url,
  icon,
  is_read
)
VALUES (
  'YOUR_USER_ID',  -- Replace with your actual user ID
  'system',
  '🎉 Test Notification',
  'If you see this in the bell icon, notifications are working!',
  '/profile',
  '🧪',
  false
);

-- Check if it was created
SELECT * FROM user_notifications 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

**Expected**: Bell icon should show "1" badge

---

### Step 5: Check Network Tab

1. Open DevTools → Network tab
2. Filter by "user_notifications"
3. Click the bell icon
4. Look for POST/GET requests

**What to look for**:
- Request to Supabase (should see API call)
- Status 200 (success)
- Response contains notification data

**If no request**: Component not mounted or not querying
**If 401/403**: RLS policy blocking access
**If 404**: Table doesn't exist

---

### Step 6: Verify RLS Policies

```sql
-- Check if policies allow SELECT
SELECT * FROM pg_policies 
WHERE tablename = 'user_notifications'
AND cmd = 'SELECT';

-- Should see policy like "Users view own notifications"

-- Test if you can select from table
SELECT COUNT(*) FROM user_notifications WHERE user_id = auth.uid();
-- Should return a number (0 or more), not an error
```

---

### Step 7: Check Auth

```sql
-- Verify you're authenticated
SELECT 
  auth.uid() as user_id,
  auth.jwt() IS NOT NULL as is_authenticated;

-- Should return your user ID and true
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Bell Icon Not Showing

**Symptoms**: No bell icon in navbar at all

**Causes**:
- Component not imported
- User not logged in
- Build error

**Fix**:
```bash
# Check if component exists
ls src/components/notifications/

# Should see:
# NotificationBell.tsx
# NotificationList.tsx

# Restart dev server
npm run dev
# or
bun dev
```

---

### Issue 2: Bell Shows But No Notifications

**Symptoms**: Bell icon visible, but dropdown is empty

**Causes**:
- No notifications in database
- RLS policy blocking access
- Query error

**Fix**:
```sql
-- 1. Insert test notification
INSERT INTO user_notifications (user_id, notification_type, title, message)
VALUES (auth.uid(), 'system', 'Test', 'Testing notifications');

-- 2. Check RLS
SET role authenticated;
SELECT * FROM user_notifications WHERE user_id = auth.uid();

-- 3. Grant permissions if needed
GRANT SELECT ON user_notifications TO authenticated;
```

---

### Issue 3: Notifications Created But Not Appearing

**Symptoms**: DB has notifications, but bell doesn't show them

**Causes**:
- User ID mismatch
- Query using wrong user ID
- Caching issue

**Fix**:
```sql
-- Check user IDs match
SELECT 
  n.user_id as notification_user,
  auth.uid() as current_user,
  n.user_id = auth.uid() as ids_match
FROM user_notifications n
WHERE n.user_id = auth.uid()
LIMIT 1;

-- If no results, notifications are for different user
-- Check what user_id notifications have:
SELECT DISTINCT user_id FROM user_notifications;
```

**In browser**:
```javascript
// Open console and run:
localStorage.clear();
// Then refresh page
```

---

### Issue 4: Chapter Notifications Not Working

**Symptoms**: Manual notifications work, but chapter notifications don't

**Causes**:
- Trigger not created
- Trigger disabled
- Not following any series
- Chapter not published

**Fix**:
```sql
-- 1. Check trigger exists and is enabled
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_notify_new_chapter';

-- 2. Enable trigger if disabled
ALTER TABLE chapters ENABLE TRIGGER trigger_notify_new_chapter;

-- 3. Check you're following a series
SELECT s.title 
FROM series_follows sf
JOIN series s ON s.id = sf.series_id
WHERE sf.user_id = auth.uid();

-- 4. Test trigger manually
-- (Replace SERIES_ID with series you're following)
INSERT INTO chapters (
  series_id,
  chapter_number,
  title,
  slug,
  status
) VALUES (
  'SERIES_ID',
  999,
  'Test Chapter',
  'test-chapter-999',
  'published'
);

-- Should create notification
SELECT * FROM user_notifications 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### Issue 5: Migration Errors

**Symptoms**: SQL errors when running migrations

**Causes**:
- Tables already exist
- Function conflicts
- Missing dependencies

**Fix**:
```sql
-- Check what exists
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename LIKE '%notif%';

-- Drop and recreate if needed
DROP TABLE IF EXISTS user_notifications CASCADE;
DROP FUNCTION IF EXISTS notify_followers_of_new_chapter CASCADE;

-- Then run migrations again
```

---

## ✅ Verification Checklist

Run through this checklist:

- [ ] Migrations applied successfully (no errors)
- [ ] Tables exist: `user_notifications`, `series_follows`
- [ ] Trigger exists: `trigger_notify_new_chapter`
- [ ] Bell icon visible in navbar
- [ ] Can insert test notification manually
- [ ] Test notification appears in bell dropdown
- [ ] Can mark notification as read
- [ ] Following at least one series
- [ ] RLS policies allow SELECT/UPDATE
- [ ] No errors in browser console
- [ ] Auth token is valid

---

## 🚀 Quick Fix: Start From Scratch

If nothing works, reset everything:

```sql
-- 1. Drop everything
DROP TABLE IF EXISTS user_notifications CASCADE;
DROP TABLE IF EXISTS series_follows CASCADE;
DROP FUNCTION IF EXISTS notify_followers_of_new_chapter CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_new_chapter ON chapters;

-- 2. Run Migration 1
-- (profile_enhancements.sql)

-- 3. Run Migration 2
-- (chapter_notifications.sql)

-- 4. Insert test notification
INSERT INTO user_notifications (user_id, notification_type, title, message)
SELECT auth.uid(), 'system', 'Test', 'System is working!'
WHERE auth.uid() IS NOT NULL;

-- 5. Check result
SELECT * FROM user_notifications WHERE user_id = auth.uid();
```

---

## 📞 Still Not Working?

### Provide This Information:

1. **Migration status**:
```sql
SELECT COUNT(*) FROM user_notifications;
SELECT COUNT(*) FROM series_follows;
SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trigger_notify_new_chapter';
```

2. **Browser console errors** (screenshot or copy text)

3. **Network tab** (any failed requests?)

4. **Auth status**:
```sql
SELECT auth.uid() IS NOT NULL as logged_in;
```

5. **Component check**:
   - Does bell icon appear? (Yes/No)
   - Any errors in console? (Yes/No/What errors)

6. **Test notification**:
```sql
-- Did this work?
INSERT INTO user_notifications (user_id, notification_type, title, message)
VALUES (auth.uid(), 'system', 'Test', 'Test');

SELECT * FROM user_notifications WHERE user_id = auth.uid();
```

Share this info and I can help debug further!
