-- Add 5 Demo Announcement Banners
-- These are example banners showcasing different styles and use cases

-- Clear any existing demo banners first (optional)
DELETE FROM announcements WHERE title LIKE '%Demo:%' OR title LIKE '%VIP%' OR title LIKE '%Event%' OR title LIKE '%Update%' OR title LIKE '%Welcome%';

-- Banner 1: VIP Premium Subscription (Highest Priority)
INSERT INTO announcements (
  title,
  content,
  type,
  priority,
  is_active,
  show_banner,
  target_audience,
  icon
) VALUES (
  '🌟 NEW: Monthly Premium Subscription!',
  'Pay monthly for Premium access - Ad-free reading, Early chapters, Exclusive content & Priority support',
  'info',
  100,
  true,
  true,
  'all',
  '👑'
);

-- Banner 2: Special Event Announcement
INSERT INTO announcements (
  title,
  content,
  type,
  priority,
  is_active,
  show_banner,
  target_audience,
  icon
) VALUES (
  '🎉 Summer Reading Event 2026!',
  'Read 50 chapters this month to unlock exclusive badges and rewards. Event ends June 30th!',
  'event',
  90,
  true,
  true,
  'all',
  '🎁'
);

-- Banner 3: New Feature Update
INSERT INTO announcements (
  title,
  content,
  type,
  priority,
  is_active,
  show_banner,
  target_audience,
  icon
) VALUES (
  '🚀 NEW FEATURE: Auto-Scroll Reader!',
  'Hands-free reading experience with adjustable speed controls. Try it now in any chapter!',
  'success',
  80,
  true,
  true,
  'all',
  '📖'
);

-- Banner 4: Welcome Banner for New Users
INSERT INTO announcements (
  title,
  content,
  type,
  priority,
  is_active,
  show_banner,
  target_audience,
  icon
) VALUES (
  '👋 Welcome to VNRScans!',
  'New here? Start with our top-rated series and join our growing community of manga lovers!',
  'info',
  70,
  true,
  true,
  'new_users',
  '✨'
);

-- Banner 5: VIP Exclusive (Only for VIP users)
INSERT INTO announcements (
  title,
  content,
  type,
  priority,
  is_active,
  show_banner,
  target_audience,
  icon
) VALUES (
  '💎 VIP Early Access Available!',
  'Premium members get early access to new chapters - 24 hours before public release!',
  'info',
  85,
  true,
  true,
  'vip',
  '⚡'
);

-- Verify the banners were created
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
ORDER BY priority DESC, created_at DESC
LIMIT 10;
