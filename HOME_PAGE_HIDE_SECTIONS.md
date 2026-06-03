# Home Page: Hide Sections Feature

## Feature Overview

Added a "Hide this section" feature to all sections on the home page, allowing users to customize their home page by hiding sections they don't want to see. Hidden sections are saved to localStorage and persist across sessions.

---

## Sections with Hide Feature

1. **New Chapters from Followed** (`followed-chapters`) - User-only, visible when logged in
2. **Reading History** (`reading-history`) - User-only, visible when logged in  
3. **Latest Updates** (`latest-updates`) - All users
4. **Popular Manhwa** (`popular`) - All users
5. **High Score Manhwa** (`high-score`) - All users

**Note:** The Featured section at the top does NOT have hide functionality (always visible).

---

## UI Components

### 3-Dot Menu (Section Header)
```
┌────────────────────────────────────────┐
│  Section Title               [≡] [<] [>] │  ← 3-dot menu added
│  Description                            │
└────────────────────────────────────────┘
```

When clicked, shows dropdown:
```
┌──────────────────────┐
│ 👁️ Hide this section │
└──────────────────────┘
```

### Show Hidden Sections (Bottom of Page)
```
┌──────────────────────────────────────┐
│                                      │
│   3 sections hidden                  │
│                                      │
│  [👁️ Show Hidden Sections ▼]        │
│                                      │
└──────────────────────────────────────┘
```

When clicked, shows dropdown with hidden sections:
```
┌──────────────────────────────┐
│ New Chapters from Followed   │
│ Popular Manhwa               │
│ High Score Manhwa            │
└──────────────────────────────┘
```

Click any item to unhide that section.

---

## User Flow

### Hiding a Section:
1. User scrolls to any section (e.g., "Popular Manhwa")
2. Clicks the 3-dot menu button (⋮) in the section header
3. Clicks "Hide this section"
4. Section disappears immediately
5. Hidden state saved to localStorage
6. "Show Hidden Sections" button appears at bottom

### Showing a Hidden Section:
1. User scrolls to bottom of page
2. Sees "X sections hidden" message
3. Clicks "Show Hidden Sections" button
4. Dropdown shows list of hidden sections
5. Clicks on a section name
6. Section reappears in its original position
7. If no sections hidden, button disappears

---

## Technical Implementation

### State Management:
```typescript
// Hidden sections stored in localStorage as Set<string>
const [hiddenSections, setHiddenSections] = React.useState<Set<string>>(() => {
  const saved = localStorage.getItem('hiddenHomeSections');
  return saved ? new Set(JSON.parse(saved)) : new Set();
});

// Toggle section visibility
const toggleSection = (sectionId: string) => {
  setHiddenSections(prev => {
    const newSet = new Set(prev);
    if (newSet.has(sectionId)) {
      newSet.delete(sectionId);
    } else {
      newSet.add(sectionId);
    }
    localStorage.setItem('hiddenHomeSections', JSON.stringify(Array.from(newSet)));
    return newSet;
  });
};

// Check if section is hidden
const isSectionHidden = (sectionId: string) => hiddenSections.has(sectionId);
```

### Conditional Rendering:
```typescript
{!isSectionHidden('popular') && (
  <SeriesCarouselSection
    sectionId="popular"
    onHide={() => toggleSection('popular')}
    title="Popular Manhwa"
    // ... other props
  />
)}
```

### Component Props Added:
```typescript
// Added to ChapterCarouselSection, SeriesCarouselSection, LatestUpdatesSection
sectionId?: string;        // Unique identifier for the section
onHide?: () => void;       // Callback to hide the section
```

### UI Components Used:
```typescript
import { MoreVertical, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

---

## Section IDs

| Section Name | Section ID | User Only |
|--------------|------------|-----------|
| New Chapters from Followed | `followed-chapters` | ✅ |
| Reading History | `reading-history` | ✅ |
| Latest Updates | `latest-updates` | ❌ |
| Popular Manhwa | `popular` | ❌ |
| High Score Manhwa | `high-score` | ❌ |

---

## LocalStorage Structure

**Key:** `hiddenHomeSections`  
**Value:** JSON array of section IDs

**Example:**
```json
["popular", "high-score"]
```

This means "Popular Manhwa" and "High Score Manhwa" sections are hidden.

---

## Visual Layout

### Normal State (No Hidden Sections):
```
┌────────────────────────────────┐
│  Featured Section              │
├────────────────────────────────┤
│  Latest Updates       [≡] [<>] │
│  [Series cards...]             │
├────────────────────────────────┤
│  Popular Manhwa       [≡] [<>] │
│  [Series cards...]             │
├────────────────────────────────┤
│  High Score Manhwa    [≡] [<>] │
│  [Series cards...]             │
└────────────────────────────────┘
```

### With Hidden Sections:
```
┌────────────────────────────────┐
│  Featured Section              │
├────────────────────────────────┤
│  Latest Updates       [≡] [<>] │
│  [Series cards...]             │
├────────────────────────────────┤
│  (Popular Manhwa - HIDDEN)     │
├────────────────────────────────┤
│  (High Score Manhwa - HIDDEN)  │
├────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ 2 sections hidden        │  │
│  │ [👁️ Show Hidden Sections]│  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

## Code Changes

### File Modified:
`src/routes/home.tsx`

### Imports Added:
```typescript
import React, { type ReactNode } from "react";
import { MoreVertical, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

### State Added to HomePage:
```typescript
const [hiddenSections, setHiddenSections] = React.useState<Set<string>>(/* ... */);
const toggleSection = (sectionId: string) => {/* ... */};
const isSectionHidden = (sectionId: string) => hiddenSections.has(sectionId);
```

### Components Updated:
1. `ChapterCarouselSection` - Added sectionId, onHide props and 3-dot menu
2. `SeriesCarouselSection` - Added sectionId, onHide props and 3-dot menu
3. `LatestUpdatesSection` - Added sectionId, onHide props and 3-dot menu

### Helper Function Added:
```typescript
function getSectionTitle(sectionId: string): string {
  const titles: Record<string, string> = {
    'followed-chapters': 'New Chapters from Followed',
    'reading-history': 'Reading History',
    'latest-updates': 'Latest Updates',
    'popular': 'Popular Manhwa',
    'high-score': 'High Score Manhwa',
  };
  return titles[sectionId] || sectionId;
}
```

---

## Benefits

✅ **User Customization:**
- Users can hide sections they don't need
- Personalize home page layout
- Reduce scrolling for preferred content

✅ **Clean UI:**
- Non-intrusive 3-dot menu
- Clear "Hide" action in dropdown
- Easy to unhide from bottom

✅ **Persistent:**
- Settings saved to localStorage
- Survives page refreshes
- Survives browser restarts

✅ **Flexible:**
- Can hide any/all sections
- Can unhide any time
- No limit on hidden sections

---

## Testing Checklist

### Hide Section:
- [ ] Click 3-dot menu on any section
- [ ] Click "Hide this section"
- [ ] Section disappears immediately
- [ ] "Show Hidden Sections" button appears at bottom
- [ ] Hidden state persists after refresh

### Show Section:
- [ ] Scroll to bottom
- [ ] Click "Show Hidden Sections"
- [ ] See list of hidden sections
- [ ] Click a section name
- [ ] Section reappears in correct position
- [ ] Unhidden state persists after refresh

### Multiple Sections:
- [ ] Hide 2+ sections
- [ ] Count shown correctly ("2 sections hidden")
- [ ] All hidden sections appear in dropdown
- [ ] Unhide one → count updates
- [ ] Unhide all → button disappears

### User-Only Sections:
- [ ] Logged out → "Following" and "History" sections not visible
- [ ] Logged in → "Following" and "History" sections visible
- [ ] Hide/unhide works for logged-in user sections

### Persistence:
- [ ] Hide sections → refresh page → still hidden
- [ ] Unhide sections → refresh page → still visible
- [ ] Close browser → reopen → settings preserved

---

## Edge Cases Handled

1. **No sections hidden:** "Show Hidden Sections" button doesn't appear
2. **All sections hidden:** Can still unhide from bottom button
3. **User logs out:** User-only sections already hidden, no issue
4. **LocalStorage cleared:** Resets to default (all visible)
5. **Invalid section ID:** Filtered out, no errors

---

## Future Enhancements (Optional)

- [ ] Drag-and-drop to reorder sections
- [ ] Save section order preferences
- [ ] Export/import settings
- [ ] Reset to default layout button
- [ ] Section visibility presets (e.g., "Minimal", "Full")

---

## Summary

✅ **Feature Complete:**
- All 5 customizable sections have hide functionality
- Persistent storage with localStorage
- Clean UI with 3-dot menus
- Easy unhide with bottom button

✅ **User Experience:**
- One-click hide
- One-click unhide
- Visual feedback
- Settings persist

Perfect for users who want to customize their home page experience! 🎨✨
