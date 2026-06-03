# React Error #310 Fix - Chapter Reader

## Problem Description
Error: **"Minified React error #310: Rendered more hooks than during the previous render"**

This error occurred when opening chapters, but switching tabs and returning would temporarily fix it.

## Root Cause Analysis

### What is React Error #310?
This error means React detected that **different numbers of hooks** were called between renders of the same component. This violates React's **Rules of Hooks**, which requires:
1. Hooks must be called in the **same order** every render
2. Hooks must be at the **top level** (not inside conditions/loops)  
3. All hooks must be declared **before any conditional returns**

### The Bug Location

**File:** `src/routes/title.$titleSlug.$chapterSlug.tsx`

**Component:** `ImageView` (lines 587-807)

#### Before Fix (BROKEN):
```typescript
function ImageView() {
  // First 3 hooks
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const containerRef = useRef(null);
  
  // 3 useEffect hooks
  useEffect(() => { ... }, []);
  useEffect(() => { ... }, [chapterId, loading, pages]);
  useEffect(() => { ... }, [chapterId]);
  
  // ⚠️ EARLY RETURNS - Returns with only 6 hooks!
  if (loading) {
    return <div>Loading...</div>;
  }
  if (!pages || pages.length === 0) {
    return <div>No pages...</div>;
  }
  
  // ⚠️ MORE HOOKS AFTER THE RETURNS - These are hooks 7, 8, 9!
  const [imageErrors, setImageErrors] = useState({});
  const [imageRetries, setImageRetries] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  
  return <div>Normal render</div>;  // Now has 9 hooks!
}
```

#### The Bug Sequence:
1. **First render (loading):** Component returns early at `if (loading)` → Only 6 hooks executed
2. **Second render (loaded):** Component passes the early returns → All 9 hooks executed
3. **React error:** "You rendered more hooks this time than last time!"

### Why Tab Switching "Fixed" It
When you switched tabs and came back, React **fully remounted** the component from scratch, resetting the hook count. But the underlying bug remained - the next time you navigated to another chapter and it started loading, the error would reappear.

## The Fix

**Move ALL hooks to the top, before any conditional returns:**

```typescript
function ImageView() {
  // ✅ ALL HOOKS AT THE TOP
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const containerRef = useRef(null);
  
  // Moved image state hooks to the top
  const [imageErrors, setImageErrors] = useState({});
  const [imageRetries, setImageRetries] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  
  // All useEffect hooks
  useEffect(() => { ... }, []);
  useEffect(() => { ... }, [chapterId, loading, pages]);
  useEffect(() => { ... }, [chapterId]);
  
  // ✅ NOW SAFE - All 9 hooks run every render, regardless of early returns
  if (loading) {
    return <div>Loading...</div>;
  }
  if (!pages || pages.length === 0) {
    return <div>No pages...</div>;
  }
  
  return <div>Normal render</div>;
}
```

## Files Modified

1. **`src/routes/title.$titleSlug.$chapterSlug.tsx`**
   - Moved `hideTimeoutRef`, `controlsVisibleRef`, `lastTapRef`, and `isDoubleTapToggleRef` refs to top of `Reader` component
   - Moved `imageErrors`, `imageRetries`, and `imageLoading` state hooks to top of `ImageView` component

## Testing Verification

After this fix:
- ✅ All hooks are called in the same order every render
- ✅ No conditional hook execution
- ✅ No early returns before all hooks are declared
- ✅ No TypeScript/React diagnostics errors
- ✅ Tab switching no longer needed to "fix" the issue

## How to Verify the Fix

1. Navigate to any chapter
2. Check browser console - should see NO React error #310
3. Navigate between chapters multiple times
4. Refresh the page while on a chapter
5. All should work without errors

The error should now be **completely resolved** and won't reappear.
