# Badge System - Quick Reference Guide

## 🎯 Where Is Everything?

### Core Files

```
src/lib/profileBadges.tsx           ⭐ SINGLE SOURCE OF TRUTH
├── Icon mappings (40+ emojis)
├── Badge metadata (60+ badges)
├── enhanceBadge() function
├── BadgeIcon component
└── Shared types & constants

src/components/profile/ProfileBadges.tsx
├── Profile badge display
├── Equip/unequip functionality
├── Locked/unlocked sections
└── Badge detail modal

src/routes/_authenticated/admin/badges.tsx
├── Badge management UI
├── Create/edit/delete operations
├── Icon picker (40+ options)
└── Color picker & preview

src/routes/_authenticated/profile.tsx
├── Profile page layout
└── Displays equipped badge title next to username
```

## 📦 What to Import Where

### In Profile Components:
```typescript
import { 
  BadgeIcon,          // Icon component
  enhanceBadge,       // Badge normalizer
  difficultyWeights,  // For sorting
  difficultyColors,   // For styling
  type ProfileBadgeRow,
  type NormalizedBadge
} from "@/lib/profileBadges";
```

### In Admin Components:
```typescript
import { 
  BadgeIcon,              // Icon component
  emojiToIconName,        // For icon picker
  enhanceBadge,           // Badge normalizer
  parseBadgeDescription,  // Parse JSON
  difficultyColors,       // For styling
  type ProfileBadgeRow 
} from "@/lib/profileBadges";
```

## 🎨 Icon Mappings (Quick Lookup)

| Emoji | Lucide Icon | Use Case |
|-------|-------------|----------|
| 🧘‍♂️ | Flame | Dao cultivation |
| ⚡ | Zap | Speed/power |
| 💀 | Skull | Death/demonic |
| ⚔️ | Swords | Combat |
| 👹 | Flame | Demon/emperor |
| 🌅 | Sun | Morning/light |
| 🌙 | Moon | Night/shadow |
| 🦁 | PawPrint | Beast/animal |
| 📜 | Scroll | Scholar/text |
| ⚖️ | Scale | Judge/balance |
| 🧪 | FlaskConical | Alchemy |
| 🌌 | Orbit | Space/void |
| 👑 | Crown | Emperor/king |
| 🗡️ | Sword | Weapon |
| 🪶 | Feather | Immortal |
| ☯️ | Compass | Dao/balance |
| 🐘 | ShieldAlert | Power/strength |
| 🐢 | Shield | Defense/longevity |
| 🍶 | FlaskConical | Elixir/potion |
| 🧙‍♂️ | User | Mage/cultivator |
| 🧑‍🦳 | User | Elder |
| 👻 | Ghost | Spirit |
| 🩸 | Droplet | Blood |
| 🐾 | PawPrint | Beast |
| 😈 | Flame | Demon |
| 🌸 | Flower | Beauty/nature |
| 🏔️ | Mountain | Sect/peak |
| 🌑 | Moon | Dark/shadow |
| 💊 | Pills | Medicine |
| 📿 | Gem | Treasure |
| 🐉 | Sparkles | Dragon |
| 🔥 | Flame | Fire |
| 🌱 | Sprout | Growth/beginner |
| 🧱 | Layers | Foundation |
| 🟡 | Circle | Golden core |
| 👶 | Baby | Nascent soul |
| 🌿 | Leaf | Herb |
| 🔏 | PenTool | Talisman |
| 💠 | Grid | Array/formation |
| ⛈️ | CloudLightning | Tribulation |
| ☁️ | Cloud | Heaven/sky |
| 🛡️ | Shield | Protection |
| ⛺ | Tent | Wanderer |
| 🏅 | Award | Default/fallback |

## 🎯 Badge Categories

```typescript
type BadgeCategory = "Title" | "Badge" | "Tag";
```

- **Title**: Shows next to username (e.g., "Supreme Dao Ancestor")
- **Badge**: Icon badge shown on profile
- **Tag**: Custom name tag

## ⚔️ Difficulty Levels

```typescript
type BadgeDifficulty = "Easy" | "Moderate" | "Hard" | "Godly";
```

| Difficulty | Color | CSS Class |
|-----------|-------|-----------|
| Easy | 🟢 Green | `border-emerald-500/30 bg-emerald-500/10 text-emerald-500` |
| Moderate | 🔵 Blue | `border-sky-500/30 bg-sky-500/10 text-sky-500` |
| Hard | 🟣 Purple | `border-purple-500/30 bg-purple-500/10 text-purple-500` |
| Godly | 🔴 Red | `border-red-500/30 bg-red-500/10 text-red-500` |

## 📊 Requirement Types

```typescript
type RequirementType = 
  | "chapters_read"      // Total chapters read
  | "reading_streak"     // Consecutive days
  | "comments_posted"    // Total comments
  | "ratings_given"      // Total ratings
  | "series_followed"    // Series followed count
  | "series_completed"   // Series completed count
  | "daily_chapters"     // Chapters in one day
  | "early_reader"       // Read before 6 AM
  | "night_reader"       // Read after midnight
  | "genres_explored";   // Different genres read
```

## 🔄 Badge Enhancement Flow

```
Database Badge (raw)
    ↓
parseBadgeDescription() → Extract JSON metadata
    ↓
Look up EXTENDED_BADGE_METADATA → Get cultivation theme
    ↓
Look up LEGACY_BADGE_NAME_MAP → Check legacy migration
    ↓
Merge with Priority: JSON > Extended > Legacy > Default
    ↓
Normalized Badge (enhanced)
```

## 💾 Database Schema

```sql
-- Badge definitions
profile_badges
├── id (uuid)
├── name (text)
├── description (text/json)
├── icon (text)
├── badge_color (text)
├── requirement_type (text)
├── requirement_value (integer)
├── is_active (boolean)
└── created_at (timestamp)

-- User badge associations
user_badges
├── id (uuid)
├── user_id (uuid FK)
├── badge_id (uuid FK)
├── earned_at (timestamp)
└── is_equipped (boolean)
```

## 🔧 Common Operations

### Add New Badge Icon
```typescript
// In src/lib/profileBadges.tsx
export const emojiToIconName: Record<string, string> = {
  // ... existing mappings ...
  "🆕": "NewIconName",  // Add your mapping
};
```

### Add New Badge Definition
```typescript
// In src/lib/profileBadges.tsx
export const EXTENDED_BADGE_METADATA = {
  // ... existing badges ...
  'New Badge Key': {
    name: 'New Badge Display Name',
    category: 'Title',
    difficulty: 'Hard',
    color: '#8B5CF6',
    icon: '🆕',
  },
};
```

### Create Badge in Admin
1. Navigate to `/admin/badges`
2. Click "New Badge/Title"
3. Fill form:
   - Name, icon, category, difficulty
   - Description, requirements
   - Color, active status
4. Preview updates in real-time
5. Click "Create"

### Equip Badge in Profile
1. Navigate to `/profile`
2. Scroll to "Unlocked Dao Realms"
3. Click any earned badge
4. Click "Equip Badge" in modal
5. Badge appears next to username

## 🔍 Query Keys (React Query)

```typescript
["profile-badges", "available"]  // Available badges
["user-badges"]                  // User's earned badges
["admin", "profile-badges"]      // Admin badge list
["profile", "equipped-badge"]    // Currently equipped
["profile-roles-badges"]         // User roles
```

## 🎯 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Icon shows as emoji | Check `emojiToIconName` mapping |
| Badge not syncing | Refresh page (React Query cache) |
| New badge not appearing | Check `is_active` flag |
| Wrong icon rendering | Verify import from `@/lib/profileBadges` |
| Category/difficulty wrong | Check JSON in description field |
| TypeScript errors | Verify type imports from shared lib |

## 📱 Page URLs

- **Profile**: `http://localhost:8080/profile`
- **Admin Badges**: `http://localhost:8080/admin/badges`

## ✅ Quick Validation Checklist

- [ ] Badge shows correct Lucide icon (not emoji)
- [ ] Badge has correct color background
- [ ] Category badge shows (Title/Badge/Tag)
- [ ] Difficulty badge shows with correct color
- [ ] Description displays correctly
- [ ] Equip/unequip works
- [ ] Title appears next to username when equipped
- [ ] Changes in admin appear in profile after refresh
- [ ] No TypeScript errors
- [ ] No console errors

## 🚀 Performance Tips

1. **Use React Query cache** - Don't over-invalidate
2. **Memoize expensive computations** - Use `useMemo`
3. **Lazy load modals** - Dialog content loads on open
4. **Optimize badge sorting** - Pre-sort in query
5. **Batch badge updates** - Update multiple at once if needed

## 📚 Documentation Links

- **Full Details**: `BADGE_SYNC_SUMMARY.md`
- **Architecture**: `BADGE_ARCHITECTURE.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **Completion Summary**: `SYNC_COMPLETE.md`

---

**Last Updated:** June 4, 2026
**Status:** ✅ Production Ready
