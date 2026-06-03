# Series Carousel - Visual Guide

## 📸 What You'll See

### Admin Page: Banners & Carousel

#### Before Adding Any Series
```
╔════════════════════════════════════════════════════════╗
║  ✨ Homepage Carousel                                  ║
║  Add titles to homepage hero carousel (Max 10)        ║
║                                  [Add Title (0/10)] ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  ┌────────────────────────────────────────────────┐  ║
║  │                                                │  ║
║  │   No titles in carousel yet.                   │  ║
║  │   Add your first title!                        │  ║
║  │                                                │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

#### After Adding 5 Series
```
╔═══════════════════════════════════════════════════════════════════════╗
║  ✨ Homepage Carousel                                                 ║
║  Add titles to homepage hero carousel (Max 10)                       ║
║                                              [Add Title (5/10)] ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        ║
║  │   #1   │  │   #2   │  │   #3   │  │   #4   │  │   #5   │        ║
║  │        │  │        │  │        │  │        │  │        │        ║
║  │ [COVER]│  │ [COVER]│  │ [COVER]│  │ [COVER]│  │ [COVER]│        ║
║  │  IMAGE │  │  IMAGE │  │  IMAGE │  │  IMAGE │  │  IMAGE │        ║
║  │        │  │        │  │        │  │        │  │        │        ║
║  │        │  │        │  │        │  │        │  │        │        ║
║  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘        ║
║                                                                       ║
║  (Hover over any card to see controls)                               ║
╚═══════════════════════════════════════════════════════════════════════╝
```

#### Hover State on Card #2
```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        ║
║  │   #1   │  │ ┌──┐#2 │  │   #3   │  │   #4   │  │   #5   │        ║
║  │        │  │ │↑ │   │  │        │  │        │  │        │        ║
║  │ [COVER]│  │ │↓ │   │  │ [COVER]│  │ [COVER]│  │ [COVER]│        ║
║  │  IMAGE │  │ │🗑│   │  │  IMAGE │  │  IMAGE │  │  IMAGE │        ║
║  │        │  │ └──┘   │  │        │  │        │  │        │        ║
║  │        │  │ Title  │  │        │  │        │  │        │        ║
║  │        │  │ Visible│  │        │  │        │  │        │        ║
║  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘        ║
║                   ↑                                                  ║
║              Controls appear on hover                                ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 🖱️ Interactive Elements

### Add Title Dialog
```
┌─────────────────────────────────────┐
│  Add Title to Carousel              │
├─────────────────────────────────────┤
│                                     │
│  Select Title                       │
│  ┌─────────────────────────────┐   │
│  │ Choose a title...        ▼ │   │
│  └─────────────────────────────┘   │
│                                     │
│  Available titles:                  │
│  • Attack on Titan                  │
│  • Demon Slayer                     │
│  • Jujutsu Kaisen                   │
│  • My Hero Academia                 │
│  • Naruto                           │
│  • One Piece                        │
│  (and more...)                      │
│                                     │
│           [Cancel] [Add to Carousel]│
└─────────────────────────────────────┘
```

### Remove Confirmation
```
┌─────────────────────────────────────┐
│  Remove from carousel?              │
├─────────────────────────────────────┤
│                                     │
│  This will remove "Solo Leveling"   │
│  from the homepage carousel.        │
│                                     │
│           [Cancel] [Remove]         │
└─────────────────────────────────────┘
```

---

## 🏠 Homepage Display

### Desktop View (Full Width)
```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                    ← HOMEPAGE CAROUSEL →                      ║
║                                                               ║
║  ╔═══════════════════════════════════════════════════════╗  ║
║  ║                                                       ║  ║
║  ║              [SERIES COVER IMAGE]                     ║  ║
║  ║                                                       ║  ║
║  ║  ← [MANGA]                                        →  ║  ║
║  ║                                                       ║  ║
║  ║                                                       ║  ║
║  ║     SOLO LEVELING                                     ║  ║
║  ║     Follow Sung Jin-Woo as he transforms from the    ║  ║
║  ║     weakest Hunter to the strongest...                ║  ║
║  ║                                                       ║  ║
║  ║     [ Read Now ]                                      ║  ║
║  ║                                                       ║  ║
║  ║                   ● ○ ○ ○ ○                          ║  ║
║  ╚═══════════════════════════════════════════════════════╝  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

### Mobile View (Stacked)
```
┌───────────────────────┐
│                       │
│   [COVER IMAGE]       │
│                       │
│  ← [MANGA]        →  │
│                       │
│  SOLO LEVELING        │
│  Follow Sung Jin-Woo  │
│  as he transforms...  │
│                       │
│  [ Read Now ]         │
│                       │
│      ● ○ ○ ○ ○        │
└───────────────────────┘
```

---

## 🎨 Visual Design Elements

### Card Appearance

#### Normal State
```
┌──────────────┐
│    #3        │  ← Position badge (violet background)
│              │
│   ┌──────┐   │
│   │      │   │
│   │COVER │   │  ← Series cover image (2:3 ratio)
│   │IMAGE │   │
│   │      │   │
│   └──────┘   │
│              │
└──────────────┘
```

#### Hover State
```
┌──────────────┐
│ ┌───┐  #3    │  ← Controls appear
│ │ ↑ │        │
│ │ ↓ │        │  ← Up/Down arrows
│ │ 🗑│        │  ← Delete button
│ └───┘        │
│   ┌──────┐   │
│   │      │   │  ← Darker overlay
│   │TITLE │   │  ← Title shows
│   │      │   │
│   └──────┘   │
└──────────────┘
```

### Color Scheme
- **Violet-500**: `#8B5CF6` (borders, badges)
- **Violet-600**: `#7C3AED` (buttons, active states)
- **Border**: Violet with 20% opacity (hover: 50%)
- **Overlay**: Black gradient (80% → 40% → transparent)
- **Text**: White on dark backgrounds

---

## 📐 Layout Grid

### Desktop (1024px+)
```
[ Card 1 ]  [ Card 2 ]  [ Card 3 ]  [ Card 4 ]  [ Card 5 ]
[ Card 6 ]  [ Card 7 ]  [ Card 8 ]  [ Card 9 ]  [ Card 10]
```

### Tablet (768-1023px)
```
[ Card 1 ]  [ Card 2 ]  [ Card 3 ]
[ Card 4 ]  [ Card 5 ]  [ Card 6 ]
[ Card 7 ]  [ Card 8 ]  [ Card 9 ]
[ Card 10]
```

### Mobile (<768px)
```
[ Card 1 ]  [ Card 2 ]
[ Card 3 ]  [ Card 4 ]
[ Card 5 ]  [ Card 6 ]
[ Card 7 ]  [ Card 8 ]
[ Card 9 ]  [ Card 10]
```

---

## 🎬 Animation Effects

### Add Title
1. Click "Add Title" → Dialog slides up
2. Select series → Dropdown expands
3. Click "Add" → Success toast appears
4. Card fades in at end of grid
5. Count updates (X/10)

### Reorder
1. Hover card → Controls fade in (0.3s)
2. Click up arrow → Cards swap positions (smooth)
3. Position badges update instantly
4. Grid re-renders with animation

### Remove
1. Click trash → Dialog fades in
2. Confirm → Card fades out (0.3s)
3. Other cards slide to fill gap
4. Positions renumber smoothly

### Carousel Navigation
1. Auto-rotate → Fade transition (6s interval)
2. Click arrow → Slide transition (instant)
3. Click dot → Jump to slide (fade)
4. Swipe → Follow finger, release to snap

---

## 🔔 Toast Notifications

### Success Messages
```
┌─────────────────────────────┐
│ ✓ Added to carousel         │
└─────────────────────────────┘
```
```
┌─────────────────────────────┐
│ ✓ Removed from carousel     │
└─────────────────────────────┘
```

### Error Messages
```
┌─────────────────────────────┐
│ ✗ Maximum 10 items allowed  │
└─────────────────────────────┘
```
```
┌─────────────────────────────┐
│ ✗ Failed to update carousel │
└─────────────────────────────┘
```

---

## 📊 Status Indicators

### Count Badge
- **(0/10)** - Empty (gray/muted)
- **(5/10)** - Half full (violet)
- **(10/10)** - Full (violet, button disabled)

### Position Badges
- **#1** - First position (highest priority)
- **#5** - Middle position
- **#10** - Last position (lowest priority)

### Button States
- **Enabled**: Full color, clickable
- **Disabled**: Grayed out, no hover
- **Loading**: Spinner animation
- **Hover**: Brighter color, scale effect

---

## 🎯 Interactive Zones

### Clickable Areas

#### Admin Grid Card
```
┌──────────────┐
│ [UP ARROW]   │ ← Click to move up
│ [DOWN ARROW] │ ← Click to move down
│ [TRASH ICON] │ ← Click to remove
│              │
│   [IMAGE]    │ ← Non-clickable (display only)
│              │
└──────────────┘
```

#### Homepage Carousel
```
┌───────────────────────────┐
│ [←]                  [→] │ ← Navigation arrows
│                           │
│    [ENTIRE CAROUSEL]      │ ← Click anywhere = go to series
│                           │
│      ○ ○ ● ○ ○           │ ← Click dot = jump to slide
└───────────────────────────┘
```

---

## 🎭 Empty States

### No Carousel Items
```
╔════════════════════════════════════════╗
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │                                │   ║
║  │   No titles in carousel yet.   │   ║
║  │   Add your first title!        │   ║
║  │                                │   ║
║  └────────────────────────────────┘   ║
║                                        ║
╚════════════════════════════════════════╝
```

### No Available Series (All Added)
```
┌─────────────────────────────────────┐
│  Add Title to Carousel              │
├─────────────────────────────────────┤
│  Select Title                       │
│  ┌─────────────────────────────┐   │
│  │ No available series      ▼ │   │
│  └─────────────────────────────┘   │
│                                     │
│  All series are already in the      │
│  carousel. Remove one to add        │
│  another.                           │
└─────────────────────────────────────┘
```

---

## 🌐 Responsive Breakpoints

### XL (1280px+)
- 5 cards per row
- Full spacing (gap-4)
- Large text sizes
- All features visible

### LG (1024-1279px)
- 5 cards per row
- Normal spacing (gap-4)
- Normal text sizes
- All features visible

### MD (768-1023px)
- 3 cards per row
- Reduced spacing (gap-3)
- Medium text sizes
- Compact controls

### SM (640-767px)
- 2 cards per row
- Tight spacing (gap-2)
- Small text sizes
- Essential controls only

### XS (<640px)
- 2 cards per row
- Minimal spacing (gap-2)
- Tiny text sizes
- Touch-optimized

---

## ✨ Visual Enhancements

### Gradient Overlays
```
Top:    Transparent
        ↓
Middle: 30% black
        ↓
Bottom: 70% black
```

### Border Styling
- **Normal**: 2px solid violet-500/20
- **Hover**: 2px solid violet-500/50
- **Active**: 2px solid violet-600

### Shadow Effects
- **Card**: No shadow (border only)
- **Dialog**: Large shadow (elevation)
- **Button**: Small shadow on hover

---

## 🎪 Interaction Patterns

### Reorder Flow
```
User hovers card → Controls appear
User clicks ↑    → Card swaps with #2
Positions update → #2 becomes #3, #3 becomes #2
Grid re-renders  → Smooth animation
Homepage updates → Instant reflection
```

### Add Flow
```
User clicks "Add Title"     → Dialog opens
User selects "Solo Leveling" → Dropdown closes
User clicks "Add to Carousel" → Mutation runs
Database updated            → carousel_items insert
Query invalidated           → Fresh data fetched
Grid updates                → New card appears
Toast shows                 → "Added to carousel"
Dialog closes               → Back to grid view
```

---

**This visual guide helps you understand exactly how the feature looks and behaves!**
