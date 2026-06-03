# Series Carousel Management Feature

## Overview
Added a dedicated section in the admin Banners & Carousel page to manage which series/titles appear in the homepage hero carousel. This provides a visual, user-friendly way to showcase featured titles to visitors.

## Features Implemented

### 1. Database Schema
**File**: `supabase/migrations/20260603170000_add_series_carousel.sql`

- **New Table**: `carousel_items`
  - `id`: UUID primary key
  - `series_id`: Reference to series table (unique)
  - `position`: Integer for ordering (0-9)
  - `is_active`: Boolean flag
  - `created_at`, `updated_at`: Timestamps

- **Constraints**:
  - Maximum 10 active carousel items enforced via trigger
  - Each series can only appear once in carousel
  - Auto-updates timestamp on modification

- **RLS Policies**:
  - Public can view active carousel items
  - Admins/moderators can manage all carousel items

### 2. Admin Interface
**File**: `src/routes/_authenticated/admin/banners.tsx`

#### Series Carousel Section
- **Location**: Top of the Banners & Carousel page
- **Header**: "Homepage Carousel" with sparkles icon ✨
- **Add Button**: Shows current count (e.g., "Add Title (3/10)")
  - Disabled when limit of 10 is reached
  - Opens dialog to select available titles

#### Visual Display
- **Grid Layout**: 5 columns (desktop), 3 (tablet), 2 (mobile)
- **Card Design**:
  - 2:3 aspect ratio matching cover images
  - Cover image with hover overlay
  - Position badge (#1, #2, etc.) in top-left corner
  - Violet border (violet-500/20, hover: violet-500/50)

#### Management Controls
- **Reordering**: Up/Down arrow buttons
  - Up arrow disabled for first item
  - Down arrow disabled for last item
  - Updates position values automatically
- **Remove**: Trash button with confirmation dialog
- **Hover Effects**: Controls appear on hover with smooth transitions

#### Add Title Dialog
- **Title**: "Add Title to Carousel"
- **Fields**:
  - Dropdown showing only titles NOT already in carousel
  - Sorted alphabetically by title
- **Validation**: Button disabled if no title selected

### 3. Homepage Carousel
**File**: `src/components/HomeHeroCarousel.tsx`

#### Display Logic
- **Primary**: Shows series from `carousel_items` table if available
- **Fallback**: Shows banner items if no carousel series configured
- **Mode Detection**: Automatically detects which mode to use

#### Carousel Series Display
- **Cover Image**: Full-bleed background with gradient overlay
- **Type Badge**: Shows series type (MANGA, MANHWA, etc.) in violet
- **Title**: Large, bold white text
- **Description**: Up to 2 lines with ellipsis
- **CTA Button**: "Read Now" with glass-morphism effect
- **Link**: Navigates to `/title/{slug}`

#### Features
- **Auto-rotate**: Changes slides every 6 seconds
- **Manual Navigation**: 
  - Left/Right arrow buttons
  - Touch swipe support (mobile)
  - Dot indicators (click to jump)
- **Smooth Transitions**: All carousel interactions are animated
- **Responsive**: Adjusts height and text size for mobile/desktop

### 4. Query Structure

#### Admin Queries
1. **Carousel Items**: Fetches with series details (title, slug, cover)
2. **Available Series**: Filters out series already in carousel
3. **All Series**: For banner management (unchanged)

#### Frontend Queries
1. **Carousel Series**: Active items ordered by position
2. **Banners**: Fallback if no carousel items (unchanged)

### 5. User Flow

#### Adding a Title to Carousel
1. Admin navigates to "Banners & Carousel" page
2. Clicks "Add Title (X/10)" button in carousel section
3. Selects title from dropdown (only shows available titles)
4. Clicks "Add to Carousel"
5. Title appears at end of carousel grid
6. Success toast confirms addition

#### Reordering Carousel Items
1. Hover over any carousel card
2. Click up arrow to move left (lower position number)
3. Click down arrow to move right (higher position number)
4. Positions update immediately
5. Changes reflect on homepage instantly

#### Removing from Carousel
1. Hover over carousel card
2. Click trash icon
3. Confirm in dialog: "Remove from carousel?"
4. Item removed and positions reordered
5. Title becomes available in "Add Title" dropdown again

## Technical Details

### Database Triggers
1. **Limit Enforcement**: `check_carousel_item_limit()`
   - Prevents more than 10 active items
   - Runs before INSERT or UPDATE
   - Raises exception if limit exceeded

2. **Timestamp Update**: `update_carousel_timestamp()`
   - Auto-updates `updated_at` on modification
   - Runs before UPDATE operations

### Position Management
- Positions are 0-indexed (0-9)
- When item removed, `reorderCarouselPositions()` fills gaps
- Up/Down buttons swap positions with adjacent items
- Grid displays items in ascending position order

### Performance Optimizations
- Query invalidation on mutations ensures fresh data
- Separate queries for available vs. used series
- Indexes on `position` and `is_active` for fast lookups
- Efficient filtering using Set for used series IDs

### Security
- RLS policies ensure only admins can modify carousel
- Admin action logging for create/delete operations
- Supabase auth checks on all mutations
- Input validation on series selection

## UI/UX Design

### Visual Hierarchy
1. **Carousel Section**: Top of page, purple accents (violet-600)
2. **Banner Section**: Below carousel, traditional banner management

### Color Scheme
- **Primary**: Violet-500/600 (matches app theme)
- **Cards**: Border with hover state
- **Badges**: Position badges use solid violet-600
- **Buttons**: Ghost variants for controls, destructive for delete

### Responsive Behavior
- **Desktop (lg)**: 5 cards per row
- **Tablet (md)**: 3 cards per row
- **Mobile**: 2 cards per row
- **Controls**: Always accessible, smooth hover states

### Empty States
- **No Items**: Dashed border card with helpful message
- **No Available Series**: Dropdown shows "no options" state

## Integration Points

### Homepage
- Carousel automatically displays series from `carousel_items`
- Falls back to banner system if no carousel configured
- No manual configuration needed after setup

### Series Management
- Deleting a series automatically removes from carousel (ON DELETE CASCADE)
- Series cover images used directly
- Series descriptions truncated to 2 lines

## Future Enhancements
- Drag-and-drop reordering
- Bulk add/remove operations
- Preview carousel before going live
- Scheduled carousel rotations
- A/B testing different carousel configurations
- Click tracking for carousel items
- Custom overlay text per carousel item

## Migration Instructions

1. **Run Migration**:
   ```bash
   # Apply the new migration
   npx supabase db push
   ```

2. **Verify Tables**:
   - Check `carousel_items` table exists
   - Verify RLS policies are active
   - Test trigger by trying to add 11th item

3. **Add Initial Series**:
   - Navigate to Admin → Banners & Carousel
   - Add 5-10 popular series to carousel
   - Reorder as desired

4. **Test Frontend**:
   - Visit homepage
   - Verify carousel displays series
   - Test auto-rotation and manual navigation
   - Check mobile responsiveness

## Troubleshooting

### Issue: "Maximum 10 active carousel items allowed"
- **Cause**: Trigger enforcing limit
- **Solution**: Remove an existing item or deactivate one

### Issue: Series not appearing in dropdown
- **Cause**: Series already in carousel
- **Solution**: Remove from carousel first, then re-add

### Issue: Carousel not showing on homepage
- **Cause**: No active carousel items and no fallback banners
- **Solution**: Add at least one series to carousel

### Issue: Position numbers out of sequence
- **Cause**: Manual database edits or failed reorder
- **Solution**: Click any up/down arrow to trigger reorder

## Testing Checklist

- [x] Add series to carousel (1-10 items)
- [x] Reorder using up/down arrows
- [x] Remove series from carousel
- [x] Verify max 10 items enforced
- [x] Check homepage displays carousel
- [x] Test carousel navigation (arrows, dots, swipe)
- [x] Verify auto-rotation works
- [x] Test responsive layouts (mobile/tablet/desktop)
- [x] Confirm empty states display correctly
- [x] Verify admin logging works
- [x] Test fallback to banners when no carousel items

## Files Modified

1. `supabase/migrations/20260603170000_add_series_carousel.sql` - New migration
2. `src/routes/_authenticated/admin/banners.tsx` - Added carousel management UI
3. `src/components/HomeHeroCarousel.tsx` - Updated to display carousel series
4. `SERIES_CAROUSEL_FEATURE.md` - This documentation

## Related Features

- **Banners System**: Original announcement banner management
- **Series Management**: Admin page for managing titles
- **Homepage**: Main entry point displaying the carousel
- **Admin Dashboard**: Navigation to Banners & Carousel page
