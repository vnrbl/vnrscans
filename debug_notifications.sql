-- DEBUG SCRIPT: Check Notification System
-- Run each section separately to identify the issue

-- ============================================
-- STEP 1: Check if tables exist
-- ============================================
SELECT 'Checking tables...' as status;

-- Check user_notifications table
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'user_notifications'
) as user_notifications_exists;

-- Check series_follows table
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'series_follows'
) as series_follows_exists;

-- ============================================
-- STEP 2: Check if trigger exists
-- ============================================
SELECT 'Checking trigger...' as status;

SELECT 
  tgname as trigger_name,
  tgenabled as is_enabled,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'trigger_notify_new_chapter';

-- ============================================
-- STEP 3: Check current user
-- ============================================
SELECT 'Checking current user...' as status;

SELECT 
  auth.uid() as current_user_id,
  (SELECT username FROM profiles WHERE user_id = auth.uid()) as username;

-- ============================================
-- STEP 4: Check if you're following any series
-- ============================================
SELECT 'Checking follows...' as status;

SELECT 
  s.title,
  s.slug,
  sf.created_at as followed_at
FROM series_follows sf
JOIN series s ON s.id = sf.series_id
WHERE sf.user_id = auth.uid();

-- ============================================
-- STEP 5: Insert a manual test notification
-- ============================================
SELECT 'Inserting test notification...' as status;

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
  auth.uid(),
  'system',
  'Test Notification',
  'If you see this, the notification table is working!',
  '/profile',
  '🧪',
  false
)
RETURNING id, title, created_at;

-- ============================================
-- STEP 6: Check if notification was created
-- ============================================
SELECT 'Checking notifications...' as status;

SELECT 
  id,
  notification_type,
  title,
  message,
  is_read,
  created_at
FROM user_notifications
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- STEP 7: Check notification settings in profile
-- ============================================
SELECT 'Checking notification settings...' as status;

SELECT 
  username,
  notification_settings
FROM profiles
WHERE user_id = auth.uid();

-- ============================================
-- STEP 8: Test the trigger function manually
-- ============================================
SELECT 'Testing trigger function...' as status;

-- First, get a series you're following
DO $$
DECLARE
  test_series_id UUID;
  test_user_id UUID;
BEGIN
  -- Get current user
  test_user_id := auth.uid();
  
  -- Get first series that user follows
  SELECT series_id INTO test_series_id
  FROM series_follows
  WHERE user_id = test_user_id
  LIMIT 1;
  
  IF test_series_id IS NULL THEN
    RAISE NOTICE 'You are not following any series. Please follow a series first.';
  ELSE
    RAISE NOTICE 'Found series: %', test_series_id;
    
    -- Try to create a notification manually
    INSERT INTO user_notifications (
      user_id,
      notification_type,
      title,
      message,
      link_url,
      icon
    )
    SELECT 
      sf.user_id,
      'chapter',
      s.title || ' - Test Chapter',
      'This is a test chapter notification',
      '/title/' || s.slug,
      '📖'
    FROM series_follows sf
    JOIN series s ON s.id = sf.series_id
    WHERE sf.series_id = test_series_id
      AND sf.user_id = test_user_id;
    
    RAISE NOTICE 'Test notification created!';
  END IF;
END $$;

-- ============================================
-- STEP 9: Check RLS policies
-- ============================================
SELECT 'Checking RLS policies...' as status;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('user_notifications', 'series_follows')
ORDER BY tablename, policyname;

-- ============================================
-- STEP 10: Final notification count
-- ============================================
SELECT 'Final results...' as status;

SELECT 
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count
FROM user_notifications
WHERE user_id = auth.uid();
