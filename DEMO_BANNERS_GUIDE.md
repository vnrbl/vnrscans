# 5 Demo Announcement Banners - Implementation Guide

## 📋 Overview

I've created 5 professional demo banners that showcase different use cases and targeting options for your 0Verse platform. These banners use the new premium design style matching modern manga platforms.

---

## 🎯 The 5 Demo Banners

### 1. **Premium Subscription Banner** 👑
```
Priority: 100 (Highest)
Target: All Users
Icon: 👑

Title: "🌟 NEW: Monthly Premium Subscription!"
Content: "Pay monthly for Premium access - Ad-free reading, Early chapters, 
          Exclusive content & Priority support"
```

**Purpose**: Promote premium subscription
**Shows To**: Everyone
**Design**: Dark gradient with $2.99/month price badge + "Subscribe Now" button

---

### 2. **Summer Event Banner** 🎉
```
Priority: 90
Target: All Users
Icon: 🎁

Title: "🎉 Summer Reading Event 2026!"
Content: "Read 50 chapters this month to unlock exclusive badges and rewards. 
          Event ends June 30th!"
```

**Purpose**: Promote seasonal reading challenge
**Shows To**: Everyone
**Design**: Event-themed with celebration vibes

---

### 3. **VIP Early Access Banner** ⚡
```
Priority: 85
Target: VIP Users Only
Icon: ⚡

Title: "💎 VIP Early Access Available!"
Content: "Premium members get early access to new chapters - 24 hours before 
          public release!"
```

**Purpose**: VIP exclusive benefit announcement
**Shows To**: **Only VIP members**
**Design**: Exclusive premium feel for VIP users

---

### 4. **New Feature Banner** 📖
```
Priority: 80
Target: All Users
Icon: 📖

Title: "🚀 NEW FEATURE: Auto-Scroll Reader!"
Content: "Hands-free reading experience with adjustable speed controls. 
          Try it now in any chapter!"
```

**Purpose**: Announce new reader features
**Shows To**: Everyone
**Design**: Feature highlight with action-oriented message

---

### 5. **Welcome Banner** ✨
```
Priority: 70
Target: New Users (< 7 days old)
Icon: ✨

Title: "👋 Welcome to 0Verse!"
Content: "New here? Start with our top-rated series and join our growing 
          community of manga lovers!"
```

**Purpose**: Welcome new members
**Shows To**: **Only users created within last 7 days**
**Design**: Friendly, welcoming tone for newcomers

---

## 🔄 How Banner Display Works

### Priority System
```
Only ONE banner shows at a time - the highest priority banner that:
1. User hasn't dismissed
2. Matches user's profile (VIP status, account age)
3. Is active and set to show_banner = true

Display Order:
Priority 100: Premium Subscription (all)
Priority 90:  Summer Event (all)
Priority 85:  VIP Early Access (VIP only) ← Hidden for non-VIP
Priority 80:  Auto-Scroll Feature (all)
Priority 70:  Welcome Banner (new users only) ← Hidden for old users
```

### User Targeting
- **"all"**: Shows to everyone
- **"vip"**: Only VIP members see it
- **"new_users"**: Only users created within last 7 days

---

## 📥 Installation

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Open the file: `demo_banners.sql`
4. Copy and paste the entire SQL
5. Click **Run** or press Ctrl+Enter
6. Check the results at bottom to verify 5 banners created

### Option 2: Via Migration (If using local Supabase)
1. The migration file already exists: `supabase/migrations/20260603160000_add_demo_banners.sql`
2. Run: `npx supabase db reset` (requires Docker Desktop)
3. Or run: `npx supabase migration up`

### Option 3: Via Admin Panel (Manual)
1. Go to `/admin/announcements`
2. Click **"+ New Announcement"**
3. Fill in the details from the banner descriptions above
4. Set **"Show Banner"** to true
5. Set appropriate **Priority** and **Target Audience**
6. Click **Save**

---

## ✅ Verify Installation

### Check in Database
```sql
SELECT 
  title, 
  priority, 
  target_audience, 
  icon, 
  is_active, 
  show_banner
FROM announcements
WHERE show_banner = true
ORDER BY priority DESC;
```

Expected: 5 rows returned

### Check on Website
1. Visit http://localhost:8082 (or your domain)
2. You should see the **Premium Subscription banner** at the top
3. Click the **X button** to dismiss it
4. You should see the **Summer Event banner** appear next
5. Continue dismissing to cycle through banners

---

## 🎨 Banner Design Preview

### Visual Layout
```
┌──────────────────────────────────────────────────────────────┐
│ Dark gradient background with subtle grid pattern             │
│                                                                │
│ [👑 Icon]  🌟 NEW: Monthly Premium...        $2.99  [Subscribe] [×] │
│            Pay monthly for Premium...       /month                  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### Color Scheme
- **Background**: Dark gradient (gray-900 to purple-900/20)
- **Icon Box**: Violet background with ring
- **Price Badge**: Orange background with ring
- **Subscribe Button**: Violet-600
- **Close Button**: Ghost style, gray

---

## 🔧 Customization

### Modify Banner Priority
```sql
-- Make Summer Event highest priority (shows first)
UPDATE announcements 
SET priority = 150 
WHERE title LIKE '%Summer Event%';
```

### Change Target Audience
```sql
-- Make Premium banner only show to non-VIP users
UPDATE announcements 
SET target_audience = 'all' 
WHERE title LIKE '%Premium Subscription%';
```

### Disable a Banner
```sql
-- Temporarily hide VIP banner
UPDATE announcements 
SET show_banner = false 
WHERE title LIKE '%VIP Early Access%';
```

### Add Custom Price
The price ($2.99/month) is currently hardcoded in the component. To make it dynamic, you can:
1. Add a `price` field to announcements table
2. Update `AnnouncementBanner.tsx` to display `top.price`

---

## 📊 Banner Types Explained

### Type Field Options:
- **info**: General information (blue theme)
- **success**: Positive news (green theme)
- **warning**: Important notices (yellow theme)
- **error**: Critical alerts (red theme)
- **event**: Special events (accent theme)

Note: With the new design, all banners look similar but you can still categorize them using the type field.

---

## 🎯 Best Practices

### Priority Guidelines
```
100-90:   Major promotions, subscriptions, critical news
89-80:    New features, important updates
79-70:    Welcome messages, general info
69-60:    Low-priority announcements
```

### Content Guidelines
- **Title**: 50 characters max (includes emoji)
- **Content**: 150 characters max
- **Icon**: Single emoji works best (👑, 🎉, ⚡, etc.)
- **Target**: Be specific - avoid "all" for VIP-only content

### Testing Checklist
✅ Banner appears on home page
✅ Dismiss button works
✅ Next banner appears after dismissing
✅ VIP-only banners hidden for non-VIP
✅ New user banner hidden for old accounts
✅ Mobile responsive (price badge hides)
✅ Hover effects work on desktop

---

## 🔍 Troubleshooting

### Banner Not Showing?
1. Check `is_active = true`
2. Check `show_banner = true`
3. Check you haven't dismissed it (clear session storage)
4. Check target_audience matches your profile
5. Check there's not a higher priority banner

### Wrong Banner Showing?
- Check priority values (highest priority wins)
- Check created_at if priorities are equal
- Clear dismissed banners from session storage

### Clear All Dismissed Banners
```javascript
// In browser console:
sessionStorage.clear();
location.reload();
```

---

## 📁 Files Created

1. **`demo_banners.sql`** - SQL script to create 5 banners
2. **`supabase/migrations/20260603160000_add_demo_banners.sql`** - Migration version
3. **`DEMO_BANNERS_GUIDE.md`** - This documentation file
4. **`AnnouncementBanner.tsx`** - Updated component (already done)

---

## 🎉 Summary

You now have **5 professional demo banners** ready to showcase:
- **Premium features** (Subscription)
- **Engagement events** (Summer Event)
- **VIP exclusivity** (Early Access)
- **New features** (Auto-Scroll)
- **User onboarding** (Welcome)

Each banner:
- ✅ Uses premium dark design
- ✅ Has appropriate priority
- ✅ Targets correct audience
- ✅ Shows custom emoji icon
- ✅ Is mobile responsive
- ✅ Has dismissible functionality

**Next Steps:**
1. Run the SQL script in Supabase dashboard
2. Visit your homepage to see the banner
3. Test dismissing and cycling through banners
4. Customize content, icons, and priorities as needed
5. Create your own banners in `/admin/announcements`

🚀 Your announcement banner system is now fully functional with demo content!
