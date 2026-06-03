# Multi-Select Filters for Browse Page

## Summary
Upgraded the Browse page with multi-select functionality for **Types** and **Genres**, displayed as clickable badge chips in rows instead of dropdown menus.

---

## ✅ What Changed

### Before:
```
Single-select dropdowns:
- Type: [Dropdown] → Select ONE type
- Genre: [Dropdown] → Select ONE genre
```

### After:
```
Multi-select badge rows:
- Type: [MANGA] [MANHWA] [MANHUA] [NOVEL] → Click multiple
- Genres: [⚔️ Action] [❤️ Romance] [✨ Fantasy] ... → Click multiple
```

---

## 🎨 Visual Design

### Type Badges:
- 4 badges in a row: MANGA, MANHWA, MANHUA, NOVEL
- **Unselected**: Outline style with white/transparent background
- **Selected**: Filled with violet color (#8B5CF6)
- Hover effect: Scale 105% for feedback
- Click to toggle on/off

### Genre Badges:
- All 20 genres displayed in wrapped rows
- Each genre has custom color and emoji icon
- **Unselected**: Outline with genre's custom color
- **Selected**: Filled with genre's custom color
- Shows icon + name (e.g., "⚔️ Action", "❤️ Romance")
- Click to toggle on/off

---

## 🔍 Filter Logic

### Type Filtering:
- **Multiple types**: Shows titles that match ANY selected type (OR logic)
- Example: Select "MANGA" + "MANHWA" → Shows all manga OR manhwa
- No selection = Shows all types

### Genre Filtering:
- **Multiple genres**: Shows titles that have ALL selected genres (AND logic)
- Example: Select "Action" + "Fantasy" → Shows only titles with BOTH genres
- This helps narrow down to specific combinations
- No selection = Shows all genres

### Why AND for genres?
Users typically want: "Show me Action + Fantasy + Isekai" (specific combination)
Rather than: "Show me anything with Action OR Fantasy OR Isekai" (too broad)

---

## 🎯 User Experience

### Selection Flow:
1. **Search** by title (optional)
2. **Click type badges** - Select one or more types
3. **Click genre badges** - Select one or more genres  
4. **Choose filters** - Status, rating, duration (dropdowns)
5. **Sort results** - Latest, popular, rating, etc.
6. **Clear all** - "Clear Filters" button appears when filters active

### Visual Feedback:
- Selected badges change color (filled background)
- Result count updates in real-time
- Shows "X types • Y genres selected" below count
- "Clear Filters" button appears when any filter is active

### Interaction:
- Click once to select
- Click again to deselect
- Can mix and match any combination
- Filters apply instantly (React Query handles caching)

---

## 💻 Technical Implementation

### State Management:
```typescript
// Changed from single values to arrays
const [typeFilters, setTypeFilters] = useState<string[]>([]);
const [genreFilters, setGenreFilters] = useState<string[]>([]);

// Toggle functions
const toggleType = (type: string) => {
  setTypeFilters(prev => 
    prev.includes(type) 
      ? prev.filter(t => t !== type)
      : [...prev, type]
  );
};

const toggleGenre = (slug: string) => {
  setGenreFilters(prev => 
    prev.includes(slug) 
      ? prev.filter(g => g !== slug)
      : [...prev, slug]
  );
};
```

### Query Logic:
```typescript
// Type filtering (OR logic - SQL IN clause)
if (typeFilters.length > 0) {
  query = query.in("type", typeFilters);
}

// Genre filtering (AND logic - all must match)
if (genreFilters.length > 0) {
  filtered = filtered.filter((series: any) => {
    const seriesGenres = series.series_tags?.map(st => st.tag?.slug) || [];
    return genreFilters.every(selectedGenre => 
      seriesGenres.includes(selectedGenre)
    );
  });
}
```

### Badge Styling:
```typescript
// Type badges - Violet when selected
<Badge
  variant={typeFilters.includes(type.value) ? "default" : "outline"}
  style={
    typeFilters.includes(type.value)
      ? { backgroundColor: "#8B5CF6", color: "white" }
      : undefined
  }
  onClick={() => toggleType(type.value)}
>
  {type.label}
</Badge>

// Genre badges - Custom color when selected
<Badge
  variant={genreFilters.includes(genre.slug) ? "default" : "outline"}
  style={
    genreFilters.includes(genre.slug)
      ? { backgroundColor: genre.color, color: "white" }
      : { borderColor: genre.color, color: genre.color }
  }
  onClick={() => toggleGenre(genre.slug)}
>
  {genre.icon && <span>{genre.icon}</span>}
  {genre.name}
</Badge>
```

---

## 📱 Responsive Design

### Desktop:
- Type badges: 4 in a single row
- Genre badges: Multiple rows with wrap
- All badges visible at once
- Smooth hover effects

### Mobile:
- Badges wrap to multiple rows
- Touch-friendly size (px-3 py-1.5)
- Tap to select/deselect
- Scrollable genre section

---

## 🎨 Color System

### Type Badges:
- Unselected: Border with foreground color
- Selected: Violet (#8B5CF6) background, white text

### Genre Badges:
Each genre has its own color:
- Action ⚔️: Red (#EF4444)
- Romance ❤️: Pink (#EC4899)
- Fantasy ✨: Purple (#A855F7)
- Sci-Fi 🚀: Blue (#3B82F6)
- Horror 👻: Black (#000000)
- ... (all 20 genres have unique colors)

Selected state uses full color background with white text.

---

## ✨ Additional Features

### Clear Filters Button:
```typescript
const hasActiveFilters = 
  typeFilters.length > 0 || 
  genreFilters.length > 0 || 
  statusFilter !== "all" || 
  contentRating !== "all" || 
  duration !== "all";

{hasActiveFilters && (
  <Button variant="ghost" onClick={clearFilters}>
    Clear Filters
  </Button>
)}
```

Appears only when filters are active.
Resets all filters to default state.

### Filter Summary:
```
23 manga found
2 types • 3 genres selected
```

Shows active filter count below result count.

---

## 🔧 Files Modified

1. **`src/routes/browse.tsx`**
   - Changed `typeFilter` → `typeFilters` (array)
   - Changed `genreFilter` → `genreFilters` (array)
   - Added `toggleType()` and `toggleGenre()` functions
   - Added `clearFilters()` function
   - Replaced dropdowns with badge rows
   - Updated query logic for multi-select
   - Added filter summary display
   - Added "Clear Filters" button

---

## 🎯 Use Cases

### Example 1: Find Korean Action Fantasy
1. Click: **MANHWA**
2. Click: **⚔️ Action**
3. Click: **✨ Fantasy**
4. Result: Only Korean action-fantasy titles

### Example 2: Browse All Romance
1. Click: **❤️ Romance**
2. Result: All romance titles (any type)

### Example 3: Japanese + Chinese Stories
1. Click: **MANGA**
2. Click: **MANHUA**
3. Result: Japanese + Chinese titles (any genre)

### Example 4: Specific Niche
1. Click: **MANHWA**
2. Click: **🌍 Isekai**
3. Click: **⚡ Revenge**
4. Click: **⏰ Regression**
5. Result: Korean regression revenge isekai stories

---

## ✅ Benefits

### For Users:
✅ **More Discovery Power** - Find exact combinations
✅ **Visual Selection** - See what's selected at a glance
✅ **Quick Toggle** - Click to add/remove filters
✅ **Better UX** - No dropdown hunting
✅ **Clear State** - Colors show what's active

### For Platform:
✅ **Better Engagement** - Users explore more
✅ **Reduced Friction** - Faster filtering
✅ **Visual Appeal** - Colorful genre badges
✅ **Flexible Filtering** - Support complex queries

---

## 🧪 Testing Checklist

- [x] Type multi-select works (OR logic)
- [x] Genre multi-select works (AND logic)
- [x] Badges change color when selected
- [x] Can select/deselect multiple times
- [x] Clear Filters button appears/works
- [x] Result count updates correctly
- [x] Filter summary shows correct counts
- [x] Genre colors display properly
- [x] Genre icons show correctly
- [x] Hover effects work
- [x] Mobile responsive
- [x] No compilation errors

---

## 🚀 Result

The Browse page now has a **much more powerful and visual filtering system**:

- **Multi-select types** - Browse multiple content types at once
- **Multi-select genres** - Find specific genre combinations
- **Visual feedback** - Colored badges show selections clearly
- **Easy interaction** - Click to toggle, no dropdown hassle
- **Clear filters** - Reset everything with one button

This makes content discovery faster, more intuitive, and more powerful! 🎉
