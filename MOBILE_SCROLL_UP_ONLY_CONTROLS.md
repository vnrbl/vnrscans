# Mobile: Controls Show ONLY on Scroll Up

## Behavior Changes

### Mobile (< 768px) - NEW BEHAVIOR:

| User Action | Controls Visibility | Duration |
|-------------|---------------------|----------|
| **Page Load** | Hidden | - |
| **At Rest (no scroll)** | Hidden | - |
| **Scrolling Down ↓** | Hidden | - |
| **Scrolling Up ↑** | **SHOW** | Visible while scrolling + 1 sec after |
| **Stop Scrolling** | **Hide** | Hides 1 second after stop |
| **Double-tap center** | Toggle | 1 second if shown |

### Desktop (≥ 768px) - NO CHANGE:

| User Action | Controls Visibility |
|-------------|---------------------|
| **Always** | Visible |
| **Mouse move** | Visible |

---

## Key Changes

### 1. Initial State
```typescript
// OLD: Controls start visible on mobile
const [controlsVisible, setControlsVisible] = useState(true);

// NEW: Controls start hidden on mobile, visible on desktop
useEffect(() => {
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    setControlsVisible(false); // Hidden on mobile
  } else {
    setControlsVisible(true);  // Visible on desktop
  }
}, []);
```

### 2. Scroll Detection Logic
```typescript
// MOBILE: Only show when actively scrolling UP
if (!isScrollingDown) {
  // Scrolling UP - show controls
  setControlsVisible(true);
  
  // Hide 1 second after user stops scrolling up
  setTimeout(() => {
    setControlsVisible(false);
  }, 1000);
} else {
  // Scrolling DOWN - hide immediately
  setControlsVisible(false);
}
```

### 3. Removed Auto-Show Events (Mobile)
```typescript
// OLD: Mouse move and scroll auto-showed controls
document.addEventListener("mousemove", handleMouseActivity);
document.addEventListener("scroll", handleScrollActivity);

// NEW: Only desktop mouse move shows controls
const handleMouseActivity = () => {
  const isDesktop = window.innerWidth >= 768;
  if (isDesktop) {
    showControls(); // Desktop only
  }
};
```

### 4. Double-Tap Toggle Updated
```typescript
// Mobile: Double-tap still works but auto-hides after 1 second
if (newVisible) {
  setTimeout(() => {
    setControlsVisible(false);
  }, 1000); // 1 second (down from 3 seconds)
}
```

---

## User Experience Flow (Mobile)

### Reading Flow:
```
1. Open chapter
   → Controls HIDDEN
   
2. Start reading (scrolling down)
   → Controls HIDDEN
   → Scroll-to-top HIDDEN
   
3. Want to navigate? Scroll up briefly
   → Controls APPEAR
   → Bottom nav visible
   → Top nav visible
   → Can tap buttons
   
4. Stop scrolling or continue down
   → Controls HIDE after 1 second
   → Clean reading experience
```

### Quick Navigation:
```
1. Scroll up quickly
   → Controls appear
   
2. Tap [Next] or [Prev] immediately
   → Navigate to chapter
   
3. Controls disappear
   → Controls auto-hide after 1 second
```

### Auto-Scroll Flow:
```
1. Scroll up to show controls
   → Controls appear
   
2. Tap [▶ Play]
   → Auto-scroll starts
   → Controls hide (scrolling down)
   → Speed control shows
   
3. Want to stop? Scroll up
   → Controls appear
   → Tap [⏸ Pause]
```

---

## What Gets Hidden/Shown

### Elements Controlled by `controlsVisible`:

1. **Top Navigation Bar**
   - Series title
   - Chapter selector dropdown
   - Back button

2. **Bottom Navigation Bar** (Mobile only)
   - Prev/Next buttons
   - Home button
   - Series info button
   - Auto-scroll play/pause
   - Fullscreen button
   - Report button

3. **Floating Controls Sidebar** (Desktop)
   - Zoom controls
   - Chapter list
   - Settings

### Elements with Independent Visibility:

1. **Scroll-to-Top Button**
   - Independent logic: Shows on scroll up (mobile), always when >300px (desktop)

2. **Auto-Scroll Speed Control**
   - Only shows when auto-scrolling is active

---

## Code Changes Summary

### State Management:
```typescript
// Initial state set based on device type
useEffect(() => {
  const isMobile = window.innerWidth < 768;
  setControlsVisible(!isMobile); // Hidden on mobile, visible on desktop
}, []);
```

### Scroll Handler:
```typescript
// Added timeout for auto-hide after scroll stops
let hideTimeout: NodeJS.Timeout | null = null;

if (!isScrollingDown) {
  setControlsVisible(true);
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    setControlsVisible(false);
  }, 1000); // Hide 1 second after scroll stops
}
```

### Event Handlers:
```typescript
// Mouse move: Desktop only
const handleMouseActivity = () => {
  if (window.innerWidth >= 768) {
    showControls();
  }
};

// Double-tap: Still works, but 1 second timeout
// Removed scroll activity handler (conflicted with scroll detection)
```

### Resize Handler:
```typescript
// Updated to set correct initial state on resize
const handleResize = () => {
  const isDesktop = window.innerWidth >= 768;
  setControlsVisible(isDesktop); // Visible on desktop, hidden on mobile
};
```

---

## Visual Representation

### Mobile States:

**State 1: Reading (Default)**
```
┌──────────────────────────────┐
│ (Top Nav HIDDEN)             │
├──────────────────────────────┤
│                              │
│  Chapter Content             │
│  Scrolling down...           │
│                              │
│                              │
│                              │
├──────────────────────────────┤
│ (Bottom Nav HIDDEN)          │
└──────────────────────────────┘
Clean, distraction-free reading
```

**State 2: Scrolling Up (Navigating)**
```
┌──────────────────────────────┐
│ Series Title | Chapter 1 ▼  │ ← Top Nav VISIBLE
├──────────────────────────────┤
│                              │
│  Chapter Content             │
│  Scrolling up...      ╔═══╗  │
│                       ║ ↑ ║  │ ← Scroll-to-Top
│                       ╚═══╝  │
│                              │
├──────────────────────────────┤
│ [Prev][🏠][📖][▶][⛶] [Next] │ ← Bottom Nav VISIBLE
└──────────────────────────────┘
Quick access to navigation
(Hides 1 second after scroll stops)
```

---

## Testing Checklist

### Mobile:

**Initial Load:**
- [ ] Open chapter → controls hidden
- [ ] Page loads → no top/bottom nav visible
- [ ] Clean reading view

**Scrolling Down:**
- [ ] Scroll down → controls stay hidden
- [ ] Continue scrolling → controls stay hidden
- [ ] At rest → controls stay hidden

**Scrolling Up:**
- [ ] Scroll up → controls appear immediately
- [ ] Stop scrolling → controls hide after 1 second
- [ ] Quick scroll up + tap button → works before hiding

**Double-Tap:**
- [ ] Double-tap center → controls toggle on
- [ ] Wait 1 second → controls auto-hide
- [ ] Double-tap again → controls toggle on

**Auto-Scroll:**
- [ ] Scroll up → controls appear
- [ ] Tap play → starts, controls hide
- [ ] Scroll up while playing → controls appear
- [ ] Tap pause → stops

### Desktop:

**Always Visible:**
- [ ] Load page → controls visible
- [ ] Scroll any direction → controls stay visible
- [ ] Mouse move → controls stay visible

---

## Benefits

✅ **Distraction-Free Reading:**
- Mobile users see full content without UI clutter
- Controls hidden by default and during reading

✅ **Easy Navigation:**
- Quick scroll up shows all controls
- 1-second grace period to tap buttons
- Intuitive gesture (up = show controls)

✅ **Consistent Behavior:**
- Scroll down = hide (always)
- Scroll up = show (always)
- At rest = hidden (clean)

✅ **Desktop Unchanged:**
- Desktop users get always-visible controls
- No change to desktop UX

---

## Summary

**Mobile:**
- ❌ Controls NOT visible on page load
- ❌ Controls NOT visible when at rest
- ❌ Controls NOT visible on scroll down
- ✅ Controls ONLY visible when scrolling up
- ✅ Auto-hide 1 second after scroll stops
- ✅ Double-tap toggle still works

**Desktop:**
- ✅ Controls always visible
- ✅ No changes to behavior

Perfect for immersive mobile reading experience! 📱✨
