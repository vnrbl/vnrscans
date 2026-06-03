-- ============================================
-- INSTANT NOTIFICATION TEST
-- ============================================
-- Run this while logged in to create a test notification immediately
-- You should see it in the bell icon in your navbar

INSERT INTO user_notifications (
  user_id,
  notification_type,
  title,
  message,
  icon,
  link_url
)
VALUES (
  auth.uid(),
  'system',
  '🎉 Notification System Works!',
  'If you can see this in the bell icon, your notification system is working perfectly!',
  '✅',
  '/profile'
);

-- Show result
SELECT 
  '✅ TEST NOTIFICATION CREATED!' as status,
  'Check the bell icon (🔔) in your navbar' as next_step;

-- Show all your notifications
SELECT 
  CASE notification_type
    WHEN 'chapter' THEN '📖'
    WHEN 'system' THEN '🔔'
    WHEN 'achievement' THEN '🏆'
    WHEN 'goal' THEN '🎯'
    ELSE '📬'
  END as icon,
  title,
  message,
  CASE WHEN is_read THEN '✓' ELSE '●' END as status,
  created_at
FROM user_notifications
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;
