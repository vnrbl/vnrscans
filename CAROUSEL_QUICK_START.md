# Series Carousel - Quick Start Guide

## What Was Added
A new section in **Admin → Banners & Carousel** to add series/manhwa as homepage carousel items (maximum 10).

## Visual Preview
The carousel displays series covers in a horizontal grid with:
- Cover images (2:3 aspect ratio)
- Position badges (#1, #2, etc.)
- Up/Down arrows for reordering
- Remove button with confirmation

## How to Use

### Step 1: Apply Database Migration
```bash
# In your terminal, navigate to project root
npx supabase db push

# Or if using Supabase CLI directly:
supabase db push
```

### Step 2: Access Admin Panel
1. Login as admin (grindwithmt@gmail.com)
2. Go to **Admin → Banners & Carousel**
3. Look for the "Homepage Carousel" section at the top

### Step 3: Add Titles
1. Click **"Add Title (0/10)"** button
2. Select a title from the dropdown
3. Click **"Add to Carousel"**
4. Repeat up to 10 titles

### Step 4: Reorder (Optional)
1. Hover over any carousel card
2. Click ↑ to move left (higher priority)
3. Click ↓ to move right (lower priority)

### Step 5: View on Homepage
1. Navigate to homepage
2. Carousel automatically displays your selected series
3. Auto-rotates every 6 seconds
4. Click arrows or swipe to navigate

## Features

### Grid Layout
- **Desktop**: 5 cards per row
- **Tablet**: 3 cards per row  
- **Mobile**: 2 cards per row

### Card Design
- Violet border (matching app theme)
- Hover effect shows title and controls
- Position badge in top-left corner
- Cover image fills entire card

### Management
- ✅ Add up to 10 series
- ✅ Reorder with up/down arrows
- ✅ Remove with confirmation dialog
- ✅ Only available series shown in dropdown
- ✅ Real-time updates on homepage

### Homepage Carousel
- ✅ Full-width cover images
- ✅ Series type badge (MANGA, MANHWA, etc.)
- ✅ Title and description overlay
- ✅ "Read Now" button
- ✅ Auto-rotation (6 seconds)
- ✅ Manual navigation (arrows, dots, swipe)
- ✅ Responsive design

## Example Series to Add
Popular titles to feature in carousel:
1. Solo Leveling
2. Tower of God
3. One Piece
4. Naruto
5. Attack on Titan
6. Jujutsu Kaisen
7. My Hero Academia
8. Demon Slayer
9. Chainsaw Man
10. Vinland Saga

## Troubleshooting

**Can't add more than 10 titles**
- ✓ This is by design (limit enforced)
- Remove one to add another

**Series not in dropdown**
- ✓ Check if it's already in carousel
- ✓ Series must exist in database

**Carousel not showing on homepage**
- ✓ Ensure at least 1 active item
- ✓ Clear browser cache
- ✓ Check series has cover image

**Position numbers wrong**
- ✓ Click any up/down arrow to reorder automatically

## What Happens Next?

### Homepage Display
- If carousel has items → Shows series carousel
- If carousel empty → Falls back to banner system
- Seamless transition between modes

### Database
- `carousel_items` table stores configuration
- Foreign key to `series` table
- RLS policies protect admin access
- Triggers enforce 10-item limit

### Admin Experience
- Visual grid interface
- Drag-like reordering (up/down)
- Instant preview of changes
- Clear status indicators

## Testing Checklist
- [ ] Migration applied successfully
- [ ] Admin page loads without errors
- [ ] Can add series (up to 10)
- [ ] Reorder buttons work
- [ ] Remove button works with confirmation
- [ ] Homepage shows carousel
- [ ] Carousel auto-rotates
- [ ] Navigation arrows work
- [ ] Mobile swipe works
- [ ] Responsive on all screen sizes

## Files Created/Modified
1. ✅ Migration: `supabase/migrations/20260603170000_add_series_carousel.sql`
2. ✅ Admin UI: `src/routes/_authenticated/admin/banners.tsx`
3. ✅ Frontend: `src/components/HomeHeroCarousel.tsx`
4. ✅ Docs: `SERIES_CAROUSEL_FEATURE.md`, `CAROUSEL_QUICK_START.md`

## Support
If you encounter issues:
1. Check browser console for errors
2. Verify migration ran successfully
3. Ensure you're logged in as admin
4. Clear cache and reload

---

**Ready to use!** Navigate to Admin → Banners & Carousel to get started.
