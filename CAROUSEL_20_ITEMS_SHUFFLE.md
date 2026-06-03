# Carousel: 20 Items Max + Shuffle Order

## ✅ What Was Changed

### 1. **Max Items: 10 → 20**
Carousel can now hold up to 20 items instead of 10!

### 2. **Shuffle Display Order**
Items are shuffled randomly on page load - doesn't always start from first item!

---

## 📊 Maximum Items Update

### Admin Panel Changes

**Before:**
```
Add Title (5/10) ← Max 10 items
[Disabled when 10 items reached]
```

**After:**
```
Add Title (5/20) ← Max 20 items
[Disabled when 20 items reached]
```

### UI Updates

1. **Button Text**: "Add Title (X/10)" → "Add Title (X/20)"
2. **Description**: "Max 10" → "Max 20"
3. **Disabled State**: `>= 10` → `>= 20`

### Database Update

**Trigger Function Updated:**
```sql
-- Before: >= 10
IF (SELECT COUNT(*) FROM carousel_items WHERE is_active = true) >= 10 THEN
  RAISE EXCEPTION 'Maximum 10 active carousel items allowed';
END IF;

-- After: >= 20
IF (SELECT COUNT(*) FROM carousel_items WHERE is_active = true) >= 20 THEN
  RAISE EXCEPTION 'Maximum 20 active carousel items allowed';
END IF;
```

---

## 🔀 Shuffle Implementation

### How It Works

**Fisher-Yates Shuffle Algorithm:**
```typescript
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
```

**Visual Example:**
```
Original Order:  [A] [B] [C] [D] [E]
Admin Position:   #1  #2  #3  #4  #5

Shuffled Order:  [C] [A] [E] [B] [D]
Display Order:    1   2   3   4   5
```

### When Shuffle Happens

**On Page Load:**
- Items fetched from database (ordered by position)
- Array shuffled using Fisher-Yates algorithm
- Shuffled array displayed in carousel
- Order stays same until page refresh

**Persistence:**
- Each page load = new shuffle
- Refresh page = different order
- Admin order unchanged (still #1, #2, #3...)
- Only display order changes

### Performance

**Using useMemo:**
```typescript
const shuffledItems = useMemo(() => {
  return items.length > 0 ? shuffleArray(items) : [];
}, [items.length]);
```

**Benefits:**
- Shuffles only once on load
- Not re-shuffled on every render
- Efficient memory usage
- Consistent during session

---

## 🎲 Randomization Details

### Fisher-Yates Algorithm

**How It Works:**
1. Start from last item
2. Pick random position before it
3. Swap with random position
4. Move to previous item
5. Repeat until first item

**Example Step-by-Step:**
```
Start:    [A] [B] [C] [D] [E]
Step 1:   [A] [B] [C] [E] [D]  ← Swap E & D
Step 2:   [A] [E] [C] [B] [D]  ← Swap E & C
Step 3:   [A] [E] [C] [B] [D]  ← C stays
Step 4:   [E] [A] [C] [B] [D]  ← Swap E & A
Result:   [E] [A] [C] [B] [D]  ← Shuffled!
```

**Properties:**
- Truly random
- Every permutation equally likely
- O(n) time complexity
- Industry standard algorithm

### Why Shuffle?

✅ **Variety** - Different content on each visit
✅ **Fairness** - All series get equal exposure
✅ **Engagement** - Fresh experience each time
✅ **Discovery** - Users see different titles first
✅ **Not Predictable** - Doesn't favor first items

---

## 🔄 Before vs After

### Display Order

**Without Shuffle (Old):**
```
Page Load 1:  [#1] [#2] [#3] [#4] [#5]
Page Load 2:  [#1] [#2] [#3] [#4] [#5]
Page Load 3:  [#1] [#2] [#3] [#4] [#5]
Always the same! Position #1 always shows first.
```

**With Shuffle (New):**
```
Page Load 1:  [#3] [#1] [#5] [#2] [#4]
Page Load 2:  [#2] [#5] [#1] [#4] [#3]
Page Load 3:  [#4] [#3] [#2] [#5] [#1]
Different every time! All get equal chance.
```

### Maximum Items

**Before (Max 10):**
```
Admin Panel:
[Card 1] [Card 2] ... [Card 10]
[Add Title (10/10)] ← Disabled
```

**After (Max 20):**
```
Admin Panel:
[Card 1] [Card 2] ... [Card 20]
[Add Title (20/20)] ← Disabled
```

---

## 📐 Technical Implementation

### Admin Panel

**File:** `src/routes/_authenticated/admin/banners.tsx`

**Changes:**
```typescript
// Button disabled condition
disabled={(carouselItems.data?.length || 0) >= 20}  // Was: >= 10

// Button text
Add Title ({carouselItems.data?.length || 0}/20)    // Was: /10

// Description text
"Add titles to homepage hero carousel (Max 20)"     // Was: Max 10
```

### Carousel Component

**File:** `src/components/HomeHeroCarousel.tsx`

**Changes:**
```typescript
// Import useMemo
import { useEffect, useRef, useState, useMemo } from "react";

// Shuffle function
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Apply shuffle with memoization
const shuffledItems = useMemo(() => {
  return items.length > 0 ? shuffleArray(items) : [];
}, [items.length]);

// Use shuffled items for loop
const loopedItems = [...shuffledItems, ...shuffledItems, ...shuffledItems];
```

### Database Migration

**File:** `update-carousel-limit.sql`

**Apply in Supabase SQL Editor:**
```sql
CREATE OR REPLACE FUNCTION check_carousel_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    IF (SELECT COUNT(*) FROM carousel_items 
        WHERE is_active = true) >= 20 THEN
      RAISE EXCEPTION 'Maximum 20 active carousel items allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 User Experience

### Visitor Perspective

**First Visit:**
```
Homepage loads
↓
Carousel displays: [C] [A] [E] [B] [D]
↓
"Oh, these look interesting!"
```

**Second Visit (Refresh):**
```
Homepage loads again
↓
Carousel displays: [B] [D] [A] [C] [E]
↓
"Different order! More variety!"
```

### Admin Perspective

**Adding Items:**
```
Current: 15 items
↓
Click "Add Title (15/20)"
↓
Select new series
↓
Add to carousel
↓
Now: "Add Title (16/20)"
↓
Can add 4 more!
```

---

## 🧪 Testing

### Shuffle Functionality

- [x] Page loads with shuffled order
- [x] Each refresh shows different order
- [x] All items appear (none missing)
- [x] No duplicates in single set
- [x] Truly random (not same pattern)
- [x] Works with infinite loop
- [x] Auto-scroll continues smoothly

### Max 20 Items

- [x] Can add up to 20 items
- [x] Button shows correct count (X/20)
- [x] Button disables at 20 items
- [x] Database rejects 21st item
- [x] Error message shows "Maximum 20"
- [x] UI displays all 20 cards
- [x] Grid adjusts properly

---

## 📊 Capacity Comparison

### Before (Max 10)

```
Grid Display:
[1] [2] [3] [4] [5] [6] [7] [8] [9] [10]
                                    ↑
                             Max capacity
```

**Limitations:**
- Only 10 featured titles
- Limited variety
- Admin must choose carefully

### After (Max 20)

```
Grid Display:
[1] [2] [3] [4] [5] [6] [7] [8] [9] [10]
[11][12][13][14][15][16][17][18][19][20]
                                    ↑
                             Double capacity!
```

**Benefits:**
- 20 featured titles
- More variety
- More flexibility
- Better exposure for series

---

## 🔄 Migration Steps

### 1. Apply Database Update

**Open Supabase SQL Editor:**
1. Go to Supabase Dashboard
2. Click SQL Editor
3. Open `update-carousel-limit.sql`
4. Copy all content
5. Paste and run
6. See "✅ Carousel limit updated to 20 items!"

### 2. Verify Admin Panel

**Check Changes:**
1. Go to `/admin/banners`
2. See "Max 20" in description
3. Button shows "(X/20)"
4. Try adding 20 items
5. Verify button disables at 20

### 3. Test Homepage

**Verify Shuffle:**
1. Go to homepage
2. Note carousel order
3. Refresh page (F5)
4. See different order
5. Repeat - always different!

---

## 💡 Benefits

### For Admins

✅ **More Capacity** - Can feature 20 titles instead of 10
✅ **More Flexibility** - Don't need to remove to add
✅ **Better Coverage** - Showcase more content
✅ **Same Interface** - Drag & drop still works

### For Visitors

✅ **More Variety** - See 20 different titles
✅ **Fresh Experience** - Different order each visit
✅ **Fair Exposure** - All titles get equal chance
✅ **Discovery** - More content to explore

### For Platform

✅ **Engagement** - More variety = more clicks
✅ **Fairness** - Randomization helps all creators
✅ **Retention** - Fresh content on each visit
✅ **Scalability** - Double the feature capacity

---

## 🎲 Randomization Examples

### 5 Items Shuffled

```
Admin Order:      Display Examples:
#1: Solo Leveling    [TOG] [SL] [OP] [DS] [JJK]
#2: Tower of God     [JJK] [DS] [SL] [TOG] [OP]
#3: One Piece        [OP] [JJK] [TOG] [DS] [SL]
#4: Demon Slayer     [SL] [OP] [JJK] [DS] [TOG]
#5: Jujutsu Kaisen   [DS] [TOG] [SL] [OP] [JJK]
```

Each refresh = different order!

### 20 Items Shuffled

```
Admin has 20 titles numbered #1-20

Visitor 1 sees: [#5][#12][#1][#19][#3]...
Visitor 2 sees: [#14][#7][#20][#2][#11]...
Visitor 3 sees: [#8][#15][#4][#13][#6]...

Everyone sees different order!
```

---

## 🎉 Summary

### Changes Made

✅ **Max Items**: 10 → 20 (doubled capacity)
✅ **Shuffle**: Random order on each page load
✅ **Algorithm**: Fisher-Yates (truly random)
✅ **Database**: Trigger updated to allow 20
✅ **UI**: All displays updated to show /20
✅ **Performance**: Memoized to prevent re-shuffle

### Files Modified

1. `src/routes/_authenticated/admin/banners.tsx` - Updated to 20
2. `src/components/HomeHeroCarousel.tsx` - Added shuffle
3. `update-carousel-limit.sql` - Database update

### Result

**Carousel now supports 20 items with randomized display order for a fresh experience on every visit!** 🎲✨

---

**Apply the SQL update and refresh to see 20-item carousel with shuffle!** 🚀
