# Auto-Scroll & Smart Hide for Mobile Chapter Reader

## Changes Made

### 1. Smart Scroll-to-Top Button Behavior

#### Mobile Behavior (< 768px):
- ✅ **Scroll Down:** Button HIDES
- ✅ **Scroll Up:** Button SHOWS (if scrolled >300px)
- ✅ **At Rest:** Button visible if last scroll was upward

#### Desktop Behavior (≥ 768px):
- ✅ **Always visible** when scrolled >300px
- ✅ No auto-hide on scroll direction

#### Implementation:
```typescript
if (isMobile && !showChapters && !showSpeedControl) {
  // Mobile: Show/hide based on scroll direction
  if (currentScrollY > 300) {
    setShowScrollTop(!isScrollingDown); // Hide on down, show on up
  } else {
    setShowScrollTop(false);
  }
} else if (!isMobile) {
  // Desktop: Always show when scrolled
  setShowScrollTop(currentScrollY > 300);
}
```

---

### 2. Auto-Scroll Feature (Mobile Only)

#### Features:
- ✅ Automatic smooth scrolling
- ✅ Adjustable speed (1x to 10x)
- ✅ Play/Pause button in bottom nav
- ✅ Speed control overlay when active
- ✅ Stops automatically at page bottom
- ✅ Mobile only (≥768px disabled)

#### State Added:
```typescript
const [isAutoScrolling, setIsAutoScrolling] = useState(false);
const [autoScrollSpeed, setAutoScrollSpeed] = useState(2); // Default 2x speed
const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
```

#### Functions Added:
```typescript
const toggleAutoScroll = () => {
  setIsAutoScrolling(!isAutoScrolling);
};

// Auto-scroll effect
useEffect(() => {
  if (!isAutoScrolling) return;
  
  // Only on mobile
  const isMobile = window.innerWidth < 768;
  if (!isMobile) {
    setIsAutoScrolling(false);
    return;
  }

  // Scroll every 16ms (~60fps)
  autoScrollIntervalRef.current = setInterval(() => {
    window.scrollBy({ top: autoScrollSpeed, behavior: 'auto' });
    
    // Stop at bottom
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) {
      setIsAutoScrolling(false);
    }
  }, 16);

  return () => clearInterval(autoScrollIntervalRef.current);
}, [isAutoScrolling, autoScrollSpeed]);
```

---

### 3. UI Components Added

#### A. Auto-Scroll Button (Mobile Bottom Nav)
```tsx
<Button 
  variant={isAutoScrolling ? "default" : "ghost"}
  size="sm" 
  onClick={toggleAutoScroll}
  title={isAutoScrolling ? "Stop Auto-scroll" : "Start Auto-scroll"}
>
  {isAutoScrolling ? <Pause /> : <Play />}
</Button>
```

**Location:** Mobile bottom navigation bar  
**Icons:** Play (▶) / Pause (⏸)  
**Style:** Highlighted when active (default variant)

#### B. Speed Control Overlay (Active Auto-Scroll)
```tsx
{isAutoScrolling && (
  <div className="fixed bottom-16 left-1/2 z-40 -translate-x-1/2 
                  rounded-full bg-background/95 px-4 py-2 shadow-lg 
                  backdrop-blur md:hidden">
    <div className="flex items-center gap-3">
      <span className="text-xs">Speed:</span>
      <Button onClick={decreaseSpeed}>-</Button>
      <span>{autoScrollSpeed.toFixed(1)}x</span>
      <Button onClick={increaseSpeed}>+</Button>
    </div>
  </div>
)}
```

**Location:** Bottom center, above bottom nav (16px gap)  
**Speed Range:** 1.0x to 10.0x (increments of 0.5)  
**Style:** Rounded pill, frosted glass effect  
**Visibility:** Only shows when auto-scrolling is active

---

## Visual Layout (Mobile)

### Normal State (Not Auto-Scrolling):
```
┌──────────────────────────────────┐
│  Top Nav (Auto-hide on scroll)   │
├──────────────────────────────────┤
│                                  │
│    Chapter Content               │
│    (Scrollable)                  │
│                          ╔═══╗   │ ← Scroll-to-Top
│                          ║ ↑ ║   │   (Shows on scroll up)
│                          ╚═══╝   │
├──────────────────────────────────┤
│ [Prev] [🏠][📖][▶][⛶][🚩] [Next]│ ← Bottom Nav
└──────────────────────────────────┘   Fixed to bottom
```

### Auto-Scrolling State:
```
┌──────────────────────────────────┐
│  Top Nav (Hidden)                │
├──────────────────────────────────┤
│                                  │
│    Chapter Content               │
│    (Auto-scrolling down)         │
│                                  │
│      ┌────────────────┐          │
│      │ Speed: [-]2.0x[+]│        │ ← Speed Control
│      └────────────────┘          │   (Floating overlay)
├──────────────────────────────────┤
│ [Prev] [🏠][📖][⏸][⛶][🚩] [Next]│ ← Bottom Nav
└──────────────────────────────────┘   (Pause highlighted)
```

---

## Complete Scroll Behaviors

### Mobile Scenarios:

| User Action | Controls Visibility | Scroll-to-Top | Auto-Scroll |
|-------------|---------------------|---------------|-------------|
| **Scroll Down** | Hide | Hide | Can start |
| **Scroll Up** | Show | Show (if >300px) | Can start |
| **At Rest** | Last state | Last state | Can start |
| **Auto-scrolling** | Hide (scrolling down) | Hide | Active |
| **Reach Bottom** | Show | Hide | Stops auto |

### Desktop Scenarios:

| User Action | Controls Visibility | Scroll-to-Top | Auto-Scroll |
|-------------|---------------------|---------------|-------------|
| **Any scroll** | Always visible | Show if >300px | Disabled |
| **At Rest** | Always visible | Show if >300px | Disabled |

---

## User Experience Flow

### Starting Auto-Scroll:
1. User scrolls down reading chapter
2. Controls hide (mobile)
3. User scrolls up briefly → controls show
4. User taps **Play (▶)** button
5. Page starts auto-scrolling
6. Speed control overlay appears
7. User can adjust speed with +/- buttons

### Adjusting Speed:
- **Tap (-)**: Decrease by 0.5x (minimum 1.0x)
- **Tap (+)**: Increase by 0.5x (maximum 10.0x)
- **Display**: Shows current speed (e.g., "2.5x")

### Stopping Auto-Scroll:
- **Tap Pause (⏸)**: Stops auto-scroll
- **Manual scroll**: Auto-scroll continues (user can override)
- **Reach bottom**: Auto-stops
- **Switch to desktop**: Auto-stops

---

## File Modified

`src/routes/title.$titleSlug.$chapterSlug.tsx`

### State Added:
```typescript
const [isAutoScrolling, setIsAutoScrolling] = useState(false);
const [autoScrollSpeed, setAutoScrollSpeed] = useState(2);
const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
```

### Functions Added:
```typescript
const toggleAutoScroll = () => {...}
```

### Effects Updated:
```typescript
// Scroll handler: Smart show/hide scroll-to-top based on direction
// Auto-scroll effect: Handles automatic scrolling with speed control
```

### UI Added:
```typescript
// Mobile bottom nav: Play/Pause button
// Speed control overlay: Floating speed adjuster
```

---

## Testing Checklist

### Scroll-to-Top Button:

**Mobile:**
- [ ] Scroll down >300px → button hides
- [ ] Scroll up → button shows
- [ ] Continue scrolling down → button hides again
- [ ] Stop scrolling → button stays in last state

**Desktop:**
- [ ] Scroll down >300px → button shows
- [ ] Scroll up → button stays visible
- [ ] Always visible when >300px scroll

### Auto-Scroll:

**Starting:**
- [ ] Tap Play → auto-scroll starts
- [ ] Button changes to Pause (highlighted)
- [ ] Speed control overlay appears
- [ ] Page scrolls down smoothly

**Speed Control:**
- [ ] Tap (-) → speed decreases
- [ ] Tap (+) → speed increases
- [ ] Min speed: 1.0x (can't go lower)
- [ ] Max speed: 10.0x (can't go higher)
- [ ] Display updates correctly

**Stopping:**
- [ ] Tap Pause → auto-scroll stops
- [ ] Reach bottom → auto-scroll stops
- [ ] Resize to desktop → auto-scroll stops
- [ ] Speed control overlay disappears

**Edge Cases:**
- [ ] Auto-scroll + manual scroll → both work
- [ ] Auto-scroll + navigation → stops on new chapter
- [ ] Auto-scroll + fullscreen → continues working
- [ ] Very slow speed (1.0x) → smooth scrolling
- [ ] Very fast speed (10.0x) → smooth scrolling

---

## Technical Details

### Auto-Scroll Implementation:
- **Interval:** 16ms (~60fps for smooth animation)
- **Scroll amount:** `autoScrollSpeed` pixels per frame
- **Speed range:** 1-10 (0.5 increments)
- **Real speed:** 1x ≈ 60px/sec, 10x ≈ 600px/sec

### Performance:
- Uses `requestAnimationFrame` for smooth scroll detection
- Cleans up intervals on unmount/stop
- Passive event listeners for better performance
- No memory leaks with proper cleanup

### Accessibility:
- Play/Pause has title attributes
- Speed controls have clear +/- buttons
- Stops automatically at bottom
- Manual scroll always available

---

## Summary

✅ **Smart Scroll-to-Top:**
- Hides on scroll down (mobile)
- Shows on scroll up (mobile)
- Always shows when scrolled (desktop)

✅ **Auto-Scroll Feature:**
- Mobile-only automatic scrolling
- Adjustable speed (1x-10x)
- Visual play/pause control
- Floating speed adjuster
- Smart auto-stop at bottom

✅ **Enhanced UX:**
- Controls hide when scrolling down
- Controls show when scrolling up
- Auto-scroll for hands-free reading
- Smooth 60fps scrolling

Perfect for reading long manga chapters hands-free on mobile! 📱📖
