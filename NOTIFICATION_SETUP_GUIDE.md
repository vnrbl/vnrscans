# Notification System - Setup & Testing Guide

## 🔧 Setup Instructions

### Step 1: Apply Both Migrations

Run these SQL files in Supabase SQL Editor in order:

#### Migration 1: Base Notification System
**File**: `supabase/migrations/20260604000000_profile_enhancements.sql`

This creates:
- `user_notifications` table
- Notification preferences in profiles
- RLS policies

#### Migration 2: Chapter Notifications Trigger
**File**: `supabase/migrations/20260604000001_chapter_notifications.sql`

This creates:
- Automatic notification trigger for new chapters
- Notifies all users following a series
- Respects notification preferences

### Step 2: Verify Tables Exist

```sql
-- Check notifications table
SELECT * FROM user_notifications LIMIT 5;

-- Check notification preferences in profiles
SELECT user_id, notification_settings FROM profiles LIMIT 5;

-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_notify_new_chapter';
```

---

## 📖 How It Works

### Automatic Chapter Notifications

**When**: A new chapter is published (status = 'published')

**Who Gets Notified**: All users who:
1. Follow the series (in `series_follows` table)
2. Have chapter notifications enabled in preferences

**Notification Contains**:
- Title: "{Series Title} - New Chapter"
- Message: "Chapter {number}: {title} is now available!"
- Link: Direct link to the new chapter
- Icon: 📖

### Trigger Flow

```
1. Admin uploads chapter → status = 'draft'
2. Admin publishes chapter → status = 'published'
3. Trigger fires automatically
4. Query finds all followers of that series
5. Creates notification for each follower
6. Bell icon shows unread count
7. User clicks bell to see notifications
```

---

## 🧪 Testing

### Test 1: Manual Notification

Insert a test notification manually:

```sql
-- Replace YOUR_USER_ID with your actual user ID
INSERT INTO user_notifications (
  user_id, 
  notification_type, 
  title, 
  message, 
  link_url, 
  icon
)
VALUES (
  'YOUR_USER_ID',
  'chapter',
  'Solo Leveling - New Chapter',
  'Chapter 150: The Final Battle is now available!',
  '/title/solo-leveling/chapter-150',
  '📖'
);
```

**Expected Result**:
- Bell icon shows badge with "1"
- Click bell to see notification
- Notification shows title and message

### Test 2: Follow a Series

1. Go to any series page
2. Click "Follow" button
3. Verify you're following:
```sql
SELECT * FROM series_follows WHERE user_id = 'YOUR_USER_ID';
```

### Test 3: Publish a Chapter

**As Admin**:
1. Go to Admin → Titles
2. Select a series you're following
3. Upload a new chapter
4. Set status to "Published"
5. Save

**Expected Result**:
- You should receive a notification
- Bell shows unread count
- Click notification to go to chapter

### Test 4: Trigger Manually

Force trigger on existing chapter:

```sql
-- This will create notifications for all followers
UPDATE chapters 
SET status = 'published', updated_at = NOW()
WHERE id = 'CHAPTER_ID'
  AND status = 'draft';
```

---

## 🎛️ Notification Preferences

Users can control notifications via their profile settings:

```sql
-- Check user's notification settings
SELECT notification_settings FROM profiles WHERE user_id = 'YOUR_USER_ID';

-- Disable chapter notifications for a user
UPDATE profiles
SET notification_settings = jsonb_set(
  COALESCE(notification_settings, '{}'::jsonb),
  '{new_chapters}',
  'false'
)
WHERE user_id = 'YOUR_USER_ID';

-- Enable chapter notifications
UPDATE profiles
SET notification_settings = jsonb_set(
  COALESCE(notification_settings, '{}'::jsonb),
  '{new_chapters}',
  'true'
)
WHERE user_id = 'YOUR_USER_ID';
```

**Default Settings** (all enabled):
```json
{
  "new_chapters": true,
  "achievements": true,
  "follows": true,
  "comments": true,
  "goals": true,
  "email_enabled": false
}
```

---

## 🔍 Debugging

### Check if trigger exists:
```sql
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'trigger_notify_new_chapter';
```

### Check recent notifications:
```sql
SELECT 
  n.*,
  p.username
FROM user_notifications n
JOIN profiles p ON p.user_id = n.user_id
ORDER BY n.created_at DESC
LIMIT 10;
```

### Check who follows a series:
```sql
SELECT 
  p.username,
  p.notification_settings->>'new_chapters' as chapter_notifs_enabled,
  sf.created_at as followed_at
FROM series_follows sf
JOIN profiles p ON p.user_id = sf.user_id
WHERE sf.series_id = 'SERIES_ID';
```

### Test notification query:
```sql
-- This shows what notifications would be created for a chapter
SELECT 
  sf.user_id,
  p.username,
  s.title as series_title,
  p.notification_settings->>'new_chapters' as will_notify
FROM series_follows sf
JOIN profiles p ON p.user_id = sf.user_id
JOIN series s ON s.id = sf.series_id
WHERE sf.series_id = 'SERIES_ID';
```

---

## 🚨 Troubleshooting

### Issue: No notifications appearing

**Check**:
1. User is following the series
2. Chapter status is 'published'
3. Trigger is enabled
4. User has notifications enabled in preferences

**Debug**:
```sql
-- 1. Check if user follows series
SELECT * FROM series_follows 
WHERE user_id = 'USER_ID' AND series_id = 'SERIES_ID';

-- 2. Check notification preferences
SELECT notification_settings FROM profiles WHERE user_id = 'USER_ID';

-- 3. Check trigger is enabled
SELECT tgenabled FROM pg_trigger WHERE tgname = 'trigger_notify_new_chapter';

-- 4. Check chapter status
SELECT id, chapter_number, title, status, scheduled_at 
FROM chapters 
WHERE series_id = 'SERIES_ID'
ORDER BY created_at DESC
LIMIT 5;
```

### Issue: Bell not showing count

**Check**:
1. NotificationBell component is imported in Navbar
2. User is logged in
3. Notifications query is working

**Fix**:
- Clear browser cache
- Check browser console for errors
- Verify auth token is valid

### Issue: Notifications not marked as read

**Check**:
1. RLS policies allow update
2. User ID matches notification user_id

**Debug**:
```sql
-- Check RLS policies on notifications
SELECT * FROM pg_policies WHERE tablename = 'user_notifications';

-- Try updating manually
UPDATE user_notifications 
SET is_read = true 
WHERE user_id = 'YOUR_USER_ID' AND id = 'NOTIFICATION_ID';
```

---

## 📊 Monitoring

### Count notifications by type:
```sql
SELECT 
  notification_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_read = false) as unread
FROM user_notifications
GROUP BY notification_type;
```

### Most active users:
```sql
SELECT 
  p.username,
  COUNT(n.id) as notification_count,
  COUNT(*) FILTER (WHERE n.is_read = false) as unread_count
FROM user_notifications n
JOIN profiles p ON p.user_id = n.user_id
GROUP BY p.username
ORDER BY notification_count DESC
LIMIT 10;
```

### Notification engagement:
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (
    CASE WHEN is_read THEN updated_at ELSE NOW() END - created_at
  )) / 60) as avg_time_to_read_minutes
FROM user_notifications
WHERE is_read = true;
```

---

## ✨ Feature Summary

**What Works Now**:
- ✅ Automatic notifications when chapters published
- ✅ Only notifies followers of that series
- ✅ Respects user notification preferences
- ✅ Bell icon shows unread count
- ✅ Click notification to navigate
- ✅ Mark as read functionality
- ✅ Auto-refresh every 2 minutes

**Notification Types Supported**:
- 📖 Chapter - New chapter published
- 🏆 Achievement - Achievement unlocked
- 👥 Follow - Someone followed you
- 💬 Comment - Reply to your comment
- 🎯 Goal - Goal completed
- ✅ System - System announcements

---

## 🎯 Next Steps

1. Apply both migrations
2. Test with manual notification
3. Follow a series
4. Publish a chapter as admin
5. Verify notification appears
6. Implement UI for notification preferences (optional)

---

**Note**: Notifications are created server-side via triggers, so they work even when users are offline. Users will see them next time they log in!
