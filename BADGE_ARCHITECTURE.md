# Badge System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SINGLE SOURCE OF TRUTH                      │
│                  src/lib/profileBadges.tsx                      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Icon Mappings (emojiToIconName)                        │   │
│  │ • 40+ emoji → Lucide icon mappings                     │   │
│  │ • 🧘‍♂️ → Flame, ⚡ → Zap, 💀 → Skull, etc.           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Extended Badge Metadata (EXTENDED_BADGE_METADATA)      │   │
│  │ • 60+ cultivation-themed badges                        │   │
│  │ • Each with: name, category, difficulty, color, icon   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Legacy Name Mappings (LEGACY_BADGE_NAME_MAP)           │   │
│  │ • Migration from generic to cultivation names          │   │
│  │ • "Top Reader" → "Supreme Dao Ancestor"                │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Canonical Badge Definitions (CANONICAL_PROFILE_BADGES) │   │
│  │ • Core 10 badges with full metadata                    │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Functions & Components                                  │   │
│  │ • enhanceBadge() - normalize badge data                │   │
│  │ • BadgeIcon - render Lucide icons                       │   │
│  │ • parseBadgeDescription() - parse JSON metadata         │   │
│  │ • difficultyColors, difficultyWeights                   │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ imports
                              ↓
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ↓                                           ↓
┌───────────────────┐                    ┌──────────────────────┐
│  Profile Page     │                    │  Admin Badges Page   │
│  /profile         │                    │  /admin/badges       │
├───────────────────┤                    ├──────────────────────┤
│ • Display badges  │                    │ • Create badges      │
│ • Equip/unequip   │                    │ • Edit badges        │
│ • Show equipped   │                    │ • Delete badges      │
│   title next to   │                    │ • Icon picker (40+)  │
│   username        │                    │ • Preview card       │
│ • Locked/unlocked │                    │ • Category select    │
│   sections        │                    │ • Difficulty select  │
└───────────────────┘                    └──────────────────────┘
        │                                           │
        │                                           │
        └─────────────────────┬─────────────────────┘
                              │
                              ↓
                    ┌──────────────────┐
                    │   Database       │
                    │  Supabase        │
                    ├──────────────────┤
                    │ profile_badges   │
                    │ • id             │
                    │ • name           │
                    │ • description    │
                    │ • icon           │
                    │ • badge_color    │
                    │ • requirement_*  │
                    │ • is_active      │
                    ├──────────────────┤
                    │ user_badges      │
                    │ • user_id        │
                    │ • badge_id       │
                    │ • earned_at      │
                    │ • is_equipped    │
                    └──────────────────┘
```

## Data Flow

### Badge Enhancement Process

```
┌──────────────────┐
│  Raw Badge Data  │ ← from database
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────────────────────────┐
│  enhanceBadge(badge)                             │
├──────────────────────────────────────────────────┤
│  1. Check if description is JSON                 │
│     • If JSON: extract category, difficulty, desc│
│                                                   │
│  2. Look up in EXTENDED_BADGE_METADATA           │
│     • Find by name or canonical name             │
│     • Get cultivation-themed metadata            │
│                                                   │
│  3. Look up in LEGACY_BADGE_NAME_MAP             │
│     • Check for legacy name migration            │
│                                                   │
│  4. Merge all sources (Priority Order):          │
│     JSON > Extended > Legacy > Default           │
└────────┬─────────────────────────────────────────┘
         │
         ↓
┌──────────────────┐
│ Normalized Badge │
├──────────────────┤
│ • name           │ ← canonical cultivation name
│ • icon           │ ← emoji for icon mapping
│ • badge_color    │ ← hex color
│ • category       │ ← Title | Badge | Tag
│ • difficulty     │ ← Easy | Moderate | Hard | Godly
│ • description    │ ← plain text description
└──────────────────┘
```

## Component Structure

### Profile Badges Component

```
ProfileBadges.tsx
├── Imports from @/lib/profileBadges
│   ├── BadgeIcon
│   ├── enhanceBadge
│   ├── difficultyWeights
│   ├── difficultyColors
│   └── types
│
├── State & Queries
│   ├── userRoles (check if admin)
│   ├── availableBadges (all badges from DB)
│   └── userBadges (user's earned badges)
│
├── Mutations
│   └── toggleEquipBadge (equip/unequip)
│
├── Computed Values
│   ├── enhancedUserBadges (with metadata)
│   ├── equippedBadge (currently equipped)
│   ├── earnedRealms (sorted unlocked)
│   └── lockedRealms (sorted locked)
│
└── UI Sections
    ├── Header ("Cultivation Badges & Titles")
    ├── Equipped Badge Card (if any)
    ├── Unlocked Dao Realms Grid
    ├── Locked Dao Realms Grid
    └── Badge Detail Dialog
```

### Admin Badges Page

```
admin/badges.tsx
├── Imports from @/lib/profileBadges
│   ├── BadgeIcon
│   ├── emojiToIconName
│   ├── enhanceBadge
│   ├── parseBadgeDescription
│   ├── difficultyColors
│   └── types
│
├── State
│   ├── open (create dialog)
│   ├── editingBadge (edit dialog)
│   └── form (badge form data)
│
├── Queries
│   └── availableBadges (all badges with enhancement)
│
├── Mutations
│   ├── createBadge (insert new badge)
│   ├── updateBadge (update existing)
│   └── deleteBadge (remove badge)
│
└── UI Components
    ├── Header with "New Badge/Title" button
    ├── Badge Grid (all badges with edit/delete)
    ├── Create Dialog (BadgeFormFields)
    ├── Edit Dialog (BadgeFormFields)
    └── BadgeFormFields Component
        ├── Name input
        ├── Icon selector (40+ options)
        ├── Category selector
        ├── Difficulty selector
        ├── Description textarea
        ├── Requirement type & value
        ├── Color picker (predefined + custom)
        ├── Active checkbox
        └── Preview card
```

## Key Features

### 1. Badge Categories
- **Title**: Displays next to username (e.g., "Supreme Dao Ancestor")
- **Badge**: Icon badge shown on profile
- **Tag**: Custom name tag

### 2. Difficulty Levels
- **Easy**: Green (border-emerald-500)
- **Moderate**: Blue (border-sky-500)
- **Hard**: Purple (border-purple-500)
- **Godly**: Red (border-red-500)

### 3. Requirement Types
- `chapters_read` - Total chapters read
- `reading_streak` - Consecutive days reading
- `comments_posted` - Total comments
- `ratings_given` - Total ratings
- `series_followed` - Series followed count
- `series_completed` - Series completed count

### 4. Icon System
- Emojis map to Lucide React icons
- 40+ icons available in picker
- Consistent across all pages
- Example: 🧘‍♂️ → Flame, ⚡ → Zap, 💀 → Skull

### 5. Badge Storage
- Description field stores JSON:
  ```json
  {
    "description": "Read 1000+ chapters",
    "category": "Title",
    "difficulty": "Godly"
  }
  ```
- Enhancement function extracts and merges with metadata
- Backward compatible with plain text descriptions

## Synchronization Points

### Profile ↔ Admin Sync

1. **Create in Admin**
   - Badge created in `profile_badges` table
   - Immediately available in profile (locked state)
   - Uses shared `enhanceBadge()` for consistent display

2. **Edit in Admin**
   - Updates `profile_badges` table
   - React Query invalidates cache
   - Profile page re-fetches and shows updates
   - Equipped badges update automatically

3. **Delete in Admin**
   - Removes from `profile_badges` table
   - Cascade deletes user associations
   - Profile page removes badge from display

4. **Equip in Profile**
   - Updates `user_badges.is_equipped`
   - Shows badge next to username
   - Displays in equipped badge card

## Benefits Summary

✅ **Consistency**: Same badge data everywhere  
✅ **Maintainability**: Single place to update  
✅ **Type Safety**: TypeScript interfaces  
✅ **Extensibility**: Easy to add new badges/icons  
✅ **Performance**: Shared enhancement logic  
✅ **UX**: Real-time sync between pages  

---

Last Updated: June 4, 2026
