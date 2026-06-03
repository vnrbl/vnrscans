-- QUICK NOTIFICATION TEST
-- Run this entire script at once in Supabase SQL Editor while logged in

-- This will tell you exactly what's wrong

-- Test 1: Are you logged in?
DO $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE NOTICE '❌ NOT LOGGED IN - Please log in to your app first';
  ELSE
    RAISE NOTICE '✅ Logged in as: %', auth.uid();
  END IF;
END $$;

-- Test 2: Does user_notifications table exist?
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_notifications') THEN
    RAISE NOTICE '✅ user_notifications table exists';
  ELSE
    RAISE NOTICE '❌ user_notifications table MISSING - Run migration: 20260604000000_profile_enhancements.sql';
  END IF;
END $$;

-- Test 3: Does series_follows table exist?
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'series_follows') THEN
    RAISE NOTICE '✅ series_follows table exists';
  ELSE
    RAISE NOTICE '❌ series_follows table MISSING - Run migration: 20260604000001_chapter_notifications.sql';
  END IF;
END $$;

-- Test 4: Can you insert a notification?
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    BEGIN
      INSERT INTO user_notifications (user_id, notification_type, title, message, icon)
      VALUES (v_user_id, 'system', '🧪 Test Notification', 'This is a test notification!', '🔔');
      
      RAISE NOTICE '✅ Test notification created successfully!';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Failed to create notification: %', SQLERRM;
    END;
  END IF;
END $$;

-- Test 5: Can you read notifications?
DO $$
DECLARE
  v_count INT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM user_notifications WHERE user_id = v_user_id;
    RAISE NOTICE '✅ You have % notifications in database', v_count;
    
    IF v_count = 0 THEN
      RAISE NOTICE '⚠️  No notifications found. Notification system may be working but you have no notifications yet.';
    END IF;
  END IF;
END $$;

-- Test 6: Check RLS policies
DO $$
DECLARE
  v_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO v_policy_count 
  FROM pg_policies 
  WHERE tablename = 'user_notifications';
  
  IF v_policy_count > 0 THEN
    RAISE NOTICE '✅ RLS policies exist (% policies)', v_policy_count;
  ELSE
    RAISE NOTICE '❌ No RLS policies found - Run migrations again';
  END IF;
END $$;

-- Test 7: Show your actual notifications
SELECT 
  '📋 YOUR NOTIFICATIONS:' as info,
  notification_type,
  title,
  message,
  is_read,
  created_at
FROM user_notifications
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- FINAL SUMMARY
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ NOTIFICATION SYSTEM IS WORKING! Check bell icon in navbar.'
    ELSE '⚠️  No notifications yet. System is ready, just needs notifications to be created.'
  END as final_status
FROM user_notifications
WHERE user_id = auth.uid();
