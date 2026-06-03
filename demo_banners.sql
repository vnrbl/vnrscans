-- ============================================
-- 5 DEMO ANNOUNCEMENT BANNERS FOR 0VERSE
-- ============================================
-- Run this in your Supabase SQL Editor or local database
-- These showcase different banner styles and use cases

-- Clear any existing demo banners (optional - remove if you want to keep existing)
-- DELETE FROM announcements WHERE is_active = true;

-- ============================================
-- Banner 1: VIP Premium Subscription (Highest Priority)
-- ============================================
INSERT INTO announcements (
  title,
  content,
  type,
  priority,
  is_active,
  show_banner,
  target_audience,
  icon,
  created_at
) VALUES (
  '🌟 NEW: Monthly Premium Subscription!',
  'Pay monthly for Premium access - Ad-free reading, Early chapters, Exclusive content & Priority support',
  'info',
  100,
  true,
  true,
  'all',
  '👑',
  NOW()
);

-- ============================================
-- Banner 2: Special Event Announcement
-- ============================================
INSERT INTO announcements (
  title,
  content,
  type,
  priority,
  is_active,
  show_banner,
  target_audience,
  icon,
  created_at
) VALUES (
  '🎉 Summer Reading Event 2026!',
  'Read 50 chapters this month to unlock exclusive badges and rewards. Event ends June 30th!',
  'event',
  90,
  true,
  true,
  'all',
  '🎁',
  NOW()
);

-- ============================================
-- Banner 3: New Feature Update
-- ============================================
INSERT INTO announcements (
  title,
  content,
  type,
  priority,
  is_active,
  show_banner,
  target_audience,
  icon,
  created_at
) VALUES (
  '🚀 NEW FEATURE: Auto-Scroll Reader!',
  'Hands-free reading experience with adjustable speed controls. Try it now in any chapter!',
  'success',
  80,
  true,
  true,
  'all',
  '📖',
  NOW()
);

-- ============================================
-- Banner 4: Welcome Banner for New Users
-- ============================================
INSERT INTO announcements (
  title,
  content,
  type,
  priority,
  is_active,
  show_banner,
  target_audience,
  icon,
  created_at
) VALUES (
  '👋 Welcome to 0Verse!',
  'New here? Start with our top-rated series and join our growing community of manga lovers!',
  'info',
  70,
  true,
  true,
  'new_users',
  '✨',
  NOW()
);

-- ============================================
-- Banner 5: VIP Exclusive (Only for VIP users)
-- ============================================
INSERT INTO announcements (
  title,
  content,
  type,
  priority,
  is_active,
  show_banner,
  target_audience,
  icon,
  created_at
) VALUES (
  '💎 VIP Early Access Available!',
  'Premium members get early access to new chapters - 24 hours before public release!',
  'info',
  85,
  true,
  true,
  'vip',
  '⚡',
  NOW()
);

-- ============================================
-- Verify banners were created successfully
-- ============================================
SELECT 
  id,
  title,
  content,
  type,
  priority,
  icon,
  target_audience,
  is_active,
  show_banner,
  created_at
FROM announcements
WHERE show_banner = true
ORDER BY priority DESC, created_at DESC;

-- ============================================
-- BANNER DISPLAY ORDER (by priority):
-- ============================================
-- 1. 👑 Premium Subscription (Priority 100) - All users
-- 2. 🎉 Summer Event (Priority 90) - All users
-- 3. ⚡ VIP Early Access (Priority 85) - VIP only
-- 4. 📖 Auto-Scroll Feature (Priority 80) - All users
-- 5. ✨ Welcome Banner (Priority 70) - New users only

-- ============================================
-- NOTES:
-- ============================================
-- - Only ONE banner shows at a time (highest priority)
-- - Users can dismiss banners (won't show again)
-- - "new_users" banners only show to users created within last 7 days
-- - "vip" banners only show to VIP members
-- - "all" banners show to everyone
-- - Banners are ordered by priority DESC, then created_at DESC
