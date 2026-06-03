# Carousel 3D Tilt & Site-Wide Margin Updates

## Summary
Implemented 3D tilt hover effect with dynamic edge detection for the Homepage Carousel and added vignette fade effects at corners. Also increased left/right margins across all site pages for better visual spacing.

## Changes Made

### 1. Homepage Carousel - 3D Tilt Effect
**File**: `src/components/HomeHeroCarousel.tsx`

#### Features Added:
- **3D Perspective Rotation**: Cards now tilt in 3D space based on mouse position
- **Dynamic Edge Detection**: 
  - Hover on top → Card tilts backward
  - Hover on bottom → Card tilts forward  
  - Hover on left → Card rotates left
  - Hover on right → Card rotates right
  - Hover in center → Minimal rotation
- **Smooth Transitions**: Cards smoothly return to flat position on mouse leave
- **Rotation Range**: ±10 degrees on both X and Y axes

#### Technical Implementation:
```tsx
style={{ perspective: '1000px' }}
onMouseMove={(e) => {
  // Calculate rotation based on cursor position relative to card center
  const rotateX = ((y - centerY) / centerY) * -10; // -10 to 10 degrees
  const rotateY = ((x - centerX) / centerX) * 10;  // -10 to 10 degrees
  card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
}}
```

### 2. Vignette Fade Effect
**File**: `src/components/HomeHeroCarousel.tsx`

Added gradient overlays at left and right edges for smooth card fade-out:
- **Left Vignette**: `bg-gradient-to-r from-background via-background/80 to-transparent`
- **Right Vignette**: `bg-gradient-to-l from-background via-background/80 to-transparent`
- **Responsive Widths**: 
  - Mobile: 128px (w-32)
  - Tablet: 160px (w-40)
  - Desktop: 192px (w-48)
- **Position**: Absolute positioned, z-10, pointer-events-none

### 3. Increased Site-Wide Margins
Updated horizontal padding from `px-4 sm:px-8` to `px-8 md:px-12 lg:px-16` across all pages:

#### Updated Files:
1. **`src/components/Navbar.tsx`** - Header navigation
2. **`src/components/Footer.tsx`** - Footer section
3. **`src/components/HomeHeroCarousel.tsx`** - Carousel container
4. **`src/routes/home.tsx`** - All sections (Featured, ChapterCarousel, SeriesCarousel, LatestUpdates)
5. **`src/routes/browse.tsx`** - Browse page
6. **`src/routes/search.tsx`** - Search page
7. **`src/routes/library.tsx`** - User library
8. **`src/routes/admin.tsx`** - Admin panel
9. **`src/routes/tags.tsx`** - Tags listing
10. **`src/routes/tags.$slug.tsx`** - Individual tag page
11. **`src/routes/rankings.tsx`** - Rankings page
12. **`src/routes/recommendations.tsx`** - Recommendations page
13. **`src/routes/title.$slug.tsx`** - Series detail page

#### Margin Scale:
- **Mobile**: 32px (px-8)
- **Tablet**: 48px (md:px-12)
- **Desktop**: 64px (lg:px-16)

## Visual Effects Summary

### Carousel Card Hover:
1. ✅ **3D Tilt** - Dynamic rotation based on cursor position
2. ✅ **Glass Reflection** - Animated shine sweep with multiple layers
3. ✅ **Violet Shadow** - Enhanced glow shadow (#8B5CF6)
4. ✅ **Title Slide-Up** - Title appears from bottom on hover
5. ✅ **Border Glow** - White border intensifies on hover
6. ✅ **Corner Highlights** - Diagonal gradient highlights
7. ✅ **Vignette Fade** - Cards fade smoothly at edges

### Site Layout:
- ✅ **Wider Margins** - More breathing room on all pages
- ✅ **Responsive Spacing** - Scales from 32px → 48px → 64px
- ✅ **Consistent Design** - Uniform spacing across entire site

## User Experience
- **Premium Feel**: 3D tilt creates physical, tangible interaction
- **Better Readability**: Increased margins reduce visual clutter
- **Smooth Transitions**: All animations are fluid and natural
- **Edge Awareness**: Vignette guides focus to visible carousel items
- **Responsive**: All effects work seamlessly across devices

## Compatibility
- Works with existing auto-scroll animation
- Compatible with infinite loop functionality
- Maintains shuffle feature
- Preserves all glass reflection effects
- No conflicts with existing hover states
