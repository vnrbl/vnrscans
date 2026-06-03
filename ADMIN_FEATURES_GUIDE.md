# Admin Panel Features Guide

## 🎯 Quick Access

### Admin Panel URLs:
- **Dashboard**: `http://localhost:8081/admin`
- **Analytics**: `http://localhost:8081/admin/analytics`
- **Titles**: `http://localhost:8081/admin/series`
- **Tags**: `http://localhost:8081/admin/tags`
- **Comments**: `http://localhost:8081/admin/comments`
- **Reports**: `http://localhost:8081/admin/reports`
- **Users**: `http://localhost:8081/admin/users`

---

## 📊 Analytics Dashboard

### What You See:
1. **Quick Stats Cards** (Top Row):
   - Total Users (+new today)
   - Total Titles (+new today)
   - Total Chapters (+new today)
   - Chapters Read Today

2. **Trending Content Tab**:
   - Top 10 most viewed titles (last 7 days)
   - Ranked #1-10 with badges
   - View counts per title
   - Cover images and types

3. **Active Users Tab**:
   - Top 10 readers (most chapters read)
   - Reading streaks (🔥 fire icon)
   - User avatars and usernames
   - Session counts

4. **Popular Tags Tab**:
   - All tags with usage counts
   - Colored badges with icons
   - Visual representation
   - Clickable to see which titles use them

5. **Recent Uploads Tab**:
   - Last 10 chapters uploaded
   - Series names and chapter numbers
   - Upload dates

### How to Use:
- Dashboard auto-refreshes every 60 seconds
- Click between tabs to explore different metrics
- Use data to understand platform health
- Identify trending content for featured sections

---

## 🏷️ Tags Management

### Creating a New Tag:

1. **Go to** `/admin/tags`
2. **Click** "New Tag" button (top right)
3. **Fill in**:
   - Tag Name (e.g., "Action", "Romance")
   - Description (optional but recommended)
   - Icon/Emoji (single emoji like ⚔️ or ❤️)
   - Color:
     - Click a preset color bubble
     - OR use color picker
     - OR enter hex code manually (#8B5CF6)
4. **Preview** shows how tag will look
5. **Click** "Create"

### Editing Tags:
- Click the pencil ✏️ icon on any tag card
- Modify any field
- Changes apply immediately to all titles using that tag
- Usage count stays the same

### Deleting Tags:
- Click the trash 🗑️ icon
- Confirm deletion
- ⚠️ **Warning**: Removes tag from ALL titles (cannot be undone)

### Tag Display:
- Grid layout with colored cards
- Shows: Name, Icon, Usage Count, Description
- Color-coded borders and backgrounds
- Sorted by usage (most popular first)

---

## 🔖 Assigning Tags to Titles

### Current Method (Database):
Since tag assignment UI isn't in the series edit form yet, use database:

```sql
-- Find tag ID
SELECT id, name FROM tags WHERE name = 'Action';

-- Find series ID
SELECT id, title FROM series WHERE title LIKE '%Your Title%';

-- Assign tag to series
INSERT INTO series_tags (series_id, tag_id)
VALUES ('series-uuid-here', 'tag-uuid-here');
```

### Coming Soon:
- Tag checkbox list in series edit dialog
- Multi-select dropdown
- Bulk tag assignment

---

## 🌐 Public-Facing Features

### Tags in Navigation:
- New "Tags" link in main navbar
- Desktop and mobile menu
- Between "Browse" and "Rankings"

### Tags Browse Page (`/tags`):
- "Trending This Month" section at top
- Full grid of all tags
- Each tag shows usage count
- Click any tag to filter titles

### Tag Detail Pages (`/tags/action`):
- Shows all titles with that tag
- Tag description and icon
- Color-themed header
- Grid of series cards
- "Back to All Tags" link

### Tags on Title Pages:
- Appear below genres on every title
- Styled with custom colors
- Clickable to browse by tag
- Icons for visual appeal

---

## 📈 Understanding Analytics

### User Metrics:
- **Total Users**: All registered accounts
- **New Users**: Signed up today
- **Active Users**: Read at least 1 chapter today
- **VIP Users**: Premium subscribers

### Content Metrics:
- **Total Titles**: All manga/manhwa/novels
- **New Titles**: Added today
- **Total Chapters**: All chapters ever uploaded
- **New Chapters**: Uploaded today

### Reading Metrics:
- **Chapters Read Today**: Total reading sessions
- **Unique Readers**: Individual users who read today
- Reading sessions track: start time, duration, completion

### Trending Calculation:
- Based on view counts
- Time-weighted (last 7 days)
- Updates in real-time
- Shown in rankings

---

## 🎨 Design System

### Tag Colors (Presets):
- Red (#EF4444) - Action, Martial Arts
- Orange (#F97316, #F59E0B) - Adventure, Comedy
- Green (#10B981, #059669) - Slice of Life, Cultivation
- Blue (#3B82F6, #2563EB) - Sci-Fi, Regression
- Purple (#8B5CF6, #A855F7, #7C3AED) - Fantasy, Isekai, Supernatural
- Pink (#EC4899) - Romance
- Magenta (#C026D3) - Reincarnation
- Indigo (#6366F1) - Mystery
- Teal (#14B8A6) - School Life
- Brown (#92400E) - Historical
- Gray (#6B7280) - Psychological
- Black (#000000) - Horror
- Dark Red (#991B1B, #DC2626) - Revenge, Martial Arts

### Badge Styling:
- Outline variant
- 15% opacity background
- Border color matches tag color
- Hover effects (scale 105%)
- Smooth transitions

---

## 🔒 Permissions

### Admin Access:
- Must have `admin` or `moderator` role in `user_roles` table
- Grant admin with script: `npx tsx scripts/grant-admin.ts your@email.com`
- Analytics and tag management restricted to admins

### Public Access:
- Browse tags: Everyone
- View tag pages: Everyone
- See tags on titles: Everyone
- Modify tags: Admins only

---

## 💡 Best Practices

### Creating Tags:
✅ **DO**:
- Use clear, recognizable names
- Add helpful descriptions
- Choose appropriate colors
- Use emoji icons for visual appeal
- Keep names concise (1-2 words)

❌ **DON'T**:
- Create duplicate tags
- Use confusing names
- Skip descriptions
- Use random colors without thought
- Create too many similar tags

### Using Analytics:
✅ **DO**:
- Check daily for platform health
- Monitor trending content
- Promote popular titles
- Reward active users
- Track growth over time

❌ **DON'T**:
- Ignore sudden drops in metrics
- Overlook inactive content
- Neglect user engagement
- Miss trending opportunities

### Tag Organization:
✅ **DO**:
- Use tags consistently across similar titles
- Tag all content for discoverability
- Review and clean up unused tags
- Update tags when content changes
- Use multiple relevant tags per title

❌ **DON'T**:
- Over-tag (5-8 tags per title is good)
- Use tags as categories (genres exist for that)
- Create tags for single titles
- Leave titles untagged

---

## 🚀 Pro Tips

1. **Feature Trending Content**: Check analytics weekly, feature top titles on homepage
2. **Tag Combinations**: Popular combos like "Isekai + Revenge" = strong category
3. **User Engagement**: Active user list = potential VIP candidates
4. **Content Gaps**: Low usage tags = opportunity for new content
5. **SEO Benefits**: Tag pages are indexable, help search visibility
6. **Reading Patterns**: Peak reading times inform best upload schedules

---

## 🔧 Troubleshooting

### Tags Not Showing on Title Page?
- Check `series_tags` table has entries
- Verify RLS policies allow public read
- Clear browser cache
- Check tag slug matches URL

### Analytics Showing Zero?
- Ensure users are reading chapters
- Check `reading_sessions` table has data
- Run `calculate_daily_analytics(CURRENT_DATE)` function
- Verify date in `daily_analytics` table

### Can't Create Tags?
- Verify admin role in `user_roles` table
- Check RLS policies
- Ensure unique name/slug
- Check database connection

### Tag Colors Not Displaying?
- Verify hex color format (#RRGGBB)
- Check CSS `style` prop applied
- Clear component cache
- Verify color value in database

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review `ANALYTICS_AND_TAGS_IMPLEMENTATION.md` for technical details
3. Check browser console for errors
4. Verify database migration applied
5. Test with different browsers

---

## 🎉 You're All Set!

Your admin panel now has powerful analytics and tag management. Use these tools to:
- Understand your platform's growth
- Organize content effectively  
- Help users discover what they love
- Make data-driven decisions

Happy managing! 🚀
