# Mobile-Only Auto-Hide for Chapter Controls

## Changes Made

Modified the chapter reader controls visibility behavior to **only auto-hide on mobile devices**, while **always showing controls on desktop/PC**.

### File Modified
`src/routes/title.$titleSlug.$chapterSlug.tsx`

### Changes

#### 1. Scroll-based Auto-hide (Mobile Only)
Updated the scroll detection to check screen width and only hide controls on mobile:

```typescript
// Scroll direction detection - hide controls on scroll down, show on scroll up (MOBILE ONLY)
useEffect(() => {
  const handleScroll = () => {
    // Only apply auto-hide on mobile (screen width < 768px)
    const isMobile = window.innerWidth < 768;
    
    if (isMobile && !showChapters && !showSpeedControl) {
      // Hide on scroll down, show on scroll up (mobile only)
      setControlsVisible(!isScrollingDown || currentScrollY < 100);
    } else if (!isMobile) {
      // Always visible on desktop
      setControlsVisible(true);
    }
  };
  // ...
}, [lastScrollY, showChapters, showSpeedControl]);
```

#### 2. Window Resize Handler
Added a resize listener to ensure controls remain visible when switching from mobile to desktop size:

```typescript
// Handle window resize - ensure controls are visible on desktop
useEffect(() => {
  const handleResize = () => {
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) {
      setControlsVisible(true);
      controlsVisibleRef.current = true;
      // Clear any pending auto-hide timeout
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize(); // Run once on mount
  
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

#### 3. Existing Mobile-Only Logic (Already Present)
The auto-hide timeout after inactivity was already mobile-only:

```typescript
// Only auto-hide on mobile, keep visible on desktop
if (window.innerWidth < 768) {
  hideTimeoutRef.current = setTimeout(() => {
    setControlsVisible(false);
  }, 3000);
}
```

### Breakpoint
**768px** - Standard mobile/desktop breakpoint (matches Tailwind's `md:` breakpoint)

### Behavior Summary

#### Mobile (< 768px):
- ✅ Controls auto-hide when scrolling down
- ✅ Controls show when scrolling up
- ✅ Controls auto-hide after 3 seconds of inactivity
- ✅ Double-tap to toggle controls visibility

#### Desktop (≥ 768px):
- ✅ Controls ALWAYS visible
- ✅ No auto-hide on scroll
- ✅ No auto-hide timeout
- ✅ Persistent visibility for easier navigation

### Testing Checklist

**Mobile:**
- [ ] Scroll down → controls hide
- [ ] Scroll up → controls show
- [ ] Stop moving → controls auto-hide after 3 seconds
- [ ] Double-tap → controls toggle

**Desktop:**
- [ ] Scroll down → controls stay visible
- [ ] Scroll up → controls stay visible
- [ ] No interaction → controls stay visible
- [ ] Resize window from desktop to mobile → auto-hide activates
- [ ] Resize window from mobile to desktop → controls become always visible

**Components Affected:**
- Top navigation bar
- Bottom navigation bar (mobile only anyway)
- Floating controls sidebar

All changes preserve existing functionality while adding the desktop-specific behavior.
