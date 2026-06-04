# Badge & Title Synchronization - Testing Guide

## Pre-requisites
✅ Build completed successfully (Exit Code: 0)
✅ No TypeScript errors
✅ All imports resolved correctly

## Test Scenarios

### 1. Profile Page Badge Display

**URL:** `http://localhost:8080/profile`

#### Test 1.1: View Equipped Badge
- [ ] Navigate to profile page
- [ ] Check "Cultivation Badges & Titles" section appears
- [ ] If badge is equipped, verify:
  - [ ] Badge shows in purple card at top
  - [ ] Badge name displays correctly
  - [ ] Icon renders (Lucide icon, not emoji)
  - [ ] Badge color applied (background tint)
  - [ ] Difficulty badge shows (Easy/Moderate/Hard/Godly)
  - [ ] Category badge shows (Title/Badge/Tag)
  - [ ] "Unequip" button appears
  - [ ] Badge title appears next to username at top of page

#### Test 1.2: View Unlocked Badges
- [ ] Scroll to "Unlocked Dao Realms" section
- [ ] Count should show (X) unlocked badges
- [ ] Each badge card shows:
  - [ ] Correct icon (Lucide, not emoji)
  - [ ] Badge name
  - [ ] Difficulty badge (colored border)
  - [ ] Category badge (Title/Badge/Tag)
  - [ ] Check mark if equipped
- [ ] Click a badge to open detail modal
- [ ] Verify detail modal shows:
  - [ ] Large icon
  - [ ] Badge name and description
  - [ ] Earned date
  - [ ] Requirement type
  - [ ] "Equip Badge" or "Unequip Badge" button

#### Test 1.3: View Locked Badges
- [ ] Scroll to "Locked Dao Realms" section
- [ ] Count should show (X) locked badges
- [ ] Each badge card shows:
  - [ ] Grayed out icon with lock overlay
  - [ ] Badge name
  - [ ] Difficulty badge
  - [ ] Category badge
- [ ] Hover over locked badge
- [ ] Verify tooltip shows:
  - [ ] Lock icon + badge name
  - [ ] How to obtain description
  - [ ] Requirement details

#### Test 1.4: Equip/Unequip Badge
- [ ] Click on an unlocked badge
- [ ] Click "Equip Badge" button
- [ ] Verify toast notification appears
- [ ] Verify badge moves to equipped section at top
- [ ] Verify badge title appears next to username
- [ ] Verify check mark appears on badge card
- [ ] Click "Unequip" button
- [ ] Verify badge removed from equipped section
- [ ] Verify title removed from username

---

### 2. Admin Badges Page

**URL:** `http://localhost:8080/admin/badges`

#### Test 2.1: View All Badges
- [ ] Navigate to admin badges page
- [ ] Check "Realms & Badges Manager" header appears
- [ ] Grid displays all badges in database
- [ ] Each badge card shows:
  - [ ] Icon (Lucide, not emoji)
  - [ ] Badge name
  - [ ] Description
  - [ ] Difficulty badge
  - [ ] Category badge
  - [ ] "Inactive" badge if not active
  - [ ] Requirement type and value
  - [ ] Edit button (pencil icon)
  - [ ] Delete button (trash icon)

#### Test 2.2: Create New Badge
- [ ] Click "New Badge/Title" button
- [ ] Dialog opens with form
- [ ] Fill in badge details:
  - **Name:** "Test Badge"
  - **Icon:** Select from dropdown (verify 40+ options available)
  - **Category:** Select "Badge" or "Title"
  - **Difficulty:** Select "Easy"
  - **Description:** "This is a test badge"
  - **Requirement Type:** "chapters_read"
  - **Requirement Value:** "50"
  - **Color:** Select or enter hex code
  - **Active:** Check checkbox
- [ ] Preview card updates in real-time
- [ ] Click "Create" button
- [ ] Verify toast notification appears
- [ ] Verify new badge appears in grid
- [ ] **Switch to profile page**
- [ ] Verify new badge appears in "Locked Dao Realms" section
- [ ] Verify icon, color, category, difficulty match

#### Test 2.3: Edit Existing Badge
- [ ] Click edit button on any badge
- [ ] Dialog opens with pre-filled form
- [ ] Change badge name to "Updated Badge Name"
- [ ] Change difficulty to "Hard"
- [ ] Change icon to different emoji
- [ ] Preview card updates
- [ ] Click "Save changes" button
- [ ] Verify toast notification appears
- [ ] Verify badge card updates in grid
- [ ] **Switch to profile page**
- [ ] Verify badge shows updated information
- [ ] If badge was equipped, verify title updates

#### Test 2.4: Delete Badge
- [ ] Click delete button on test badge
- [ ] Confirm dialog appears
- [ ] Click "Delete" to confirm
- [ ] Verify toast notification appears
- [ ] Verify badge removed from grid
- [ ] **Switch to profile page**
- [ ] Verify badge removed from locked section
- [ ] If badge was equipped, verify title removed

#### Test 2.5: Icon Picker
- [ ] Open create or edit dialog
- [ ] Click icon dropdown
- [ ] Verify dropdown shows 40+ icons
- [ ] Each option shows:
  - [ ] Lucide icon preview
  - [ ] Icon name (e.g., "Flame")
  - [ ] Emoji in parentheses (e.g., "🧘‍♂️")
- [ ] Select an icon
- [ ] Verify preview card updates with new icon
- [ ] Verify icon renders as Lucide component, not emoji

#### Test 2.6: Category & Difficulty Selection
- [ ] Open create or edit dialog
- [ ] Category dropdown shows:
  - [ ] Title (Name Title)
  - [ ] Badge (Icon Badge)
  - [ ] Tag (Name Tag)
- [ ] Difficulty dropdown shows:
  - [ ] Easy (green styling)
  - [ ] Moderate (blue styling)
  - [ ] Hard (purple styling)
  - [ ] Godly (red styling)
- [ ] Select each option and verify preview card updates

#### Test 2.7: Color Picker
- [ ] Open create or edit dialog
- [ ] Predefined colors show (15 color swatches)
- [ ] Click a predefined color
- [ ] Verify preview card background color updates
- [ ] Use color picker input to select custom color
- [ ] Verify hex code input updates
- [ ] Type hex code manually
- [ ] Verify preview card updates

---

### 3. Cross-Page Synchronization

#### Test 3.1: Create in Admin → View in Profile
- [ ] Open admin page in one browser tab
- [ ] Open profile page in another tab
- [ ] Create new badge in admin page
- [ ] **Refresh profile page**
- [ ] Verify new badge appears in locked section
- [ ] Verify all metadata matches (icon, color, category, difficulty)

#### Test 3.2: Edit in Admin → Update in Profile
- [ ] With both pages open
- [ ] Edit badge in admin (change name, icon, color)
- [ ] **Refresh profile page**
- [ ] Verify badge updates with new information
- [ ] If badge was equipped, verify equipped card updates
- [ ] Verify username title updates if it was equipped

#### Test 3.3: Delete in Admin → Remove from Profile
- [ ] With both pages open
- [ ] Equip a badge in profile page
- [ ] Delete that badge in admin page
- [ ] **Refresh profile page**
- [ ] Verify badge removed from both locked and equipped sections
- [ ] Verify username title removed

#### Test 3.4: Equip in Profile → No Change in Admin
- [ ] Equip a badge in profile page
- [ ] Check admin page
- [ ] Verify badge still appears normally in grid
- [ ] (Admin page doesn't show equipped status, only existence)

---

### 4. Icon Rendering Tests

#### Test 4.1: All Icons Render Correctly
Test a badge with each icon type:

| Emoji | Expected Lucide Icon | Test Location |
|-------|---------------------|---------------|
| 🧘‍♂️ | Flame | Profile/Admin |
| ⚡ | Zap | Profile/Admin |
| 💀 | Skull | Profile/Admin |
| ⚔️ | Swords | Profile/Admin |
| 👹 | Flame | Profile/Admin |
| 🌅 | Sun | Profile/Admin |
| 🌙 | Moon | Profile/Admin |
| 🦁 | PawPrint | Profile/Admin |
| 📜 | Scroll | Profile/Admin |
| ⚖️ | Scale | Profile/Admin |
| 🏅 | Award | Profile/Admin |

- [ ] Create badges with each emoji
- [ ] Verify correct Lucide icon renders (not emoji)
- [ ] Verify icon color matches badge color
- [ ] Test on both profile and admin pages

---

### 5. Edge Cases

#### Test 5.1: No Badges in Database
- [ ] Clear all badges from database (or test with fresh install)
- [ ] Open profile page
- [ ] Verify fallback badges appear (10 canonical badges)
- [ ] Verify "No Badges Earned Yet" message if no badges earned

#### Test 5.2: Admin User vs Regular User
- [ ] Login as admin user
- [ ] Open profile page
- [ ] Verify admin can see all badges (even unearned)
- [ ] Logout and login as regular user
- [ ] Verify regular user only sees locked/unlocked badges properly

#### Test 5.3: JSON Description Format
- [ ] Verify badges store description as JSON:
  ```json
  {
    "description": "Badge description",
    "category": "Title",
    "difficulty": "Godly"
  }
  ```
- [ ] Verify parsing works correctly
- [ ] Verify backward compatibility with plain text descriptions

#### Test 5.4: Badge with Missing/Invalid Icon
- [ ] Create badge with emoji not in mapping
- [ ] Verify fallback to "Award" icon
- [ ] No errors in console

#### Test 5.5: Badge with Invalid Category/Difficulty
- [ ] Create badge with invalid category in JSON
- [ ] Verify fallback to "Badge" category
- [ ] Verify fallback to "Easy" difficulty
- [ ] No errors in console

---

### 6. Performance Tests

#### Test 6.1: Large Number of Badges
- [ ] Create 50+ badges in admin
- [ ] Open profile page
- [ ] Verify page loads without lag
- [ ] Verify scrolling is smooth
- [ ] Verify all badges render correctly

#### Test 6.2: Badge Enhancement Performance
- [ ] Open browser DevTools
- [ ] Check Console for performance warnings
- [ ] Verify no excessive re-renders
- [ ] Verify `enhanceBadge()` not called unnecessarily

---

## Expected Results Summary

### ✅ Profile Page Should Show:
1. Equipped badge in purple card (if any)
2. Badge title next to username (if equipped)
3. Unlocked badges in grid with check marks
4. Locked badges in grayed out grid
5. All icons as Lucide components (not emojis)
6. Correct colors, categories, and difficulties
7. Working equip/unequip functionality

### ✅ Admin Page Should Show:
1. All badges in manageable grid
2. 40+ icon options in picker
3. Working create/edit/delete operations
4. Real-time preview card
5. All form fields validated
6. Toast notifications for actions

### ✅ Synchronization Should Work:
1. Create in admin → appears in profile (after refresh)
2. Edit in admin → updates in profile (after refresh)
3. Delete in admin → removes from profile (after refresh)
4. Equip in profile → title appears next to username
5. No duplicate code between pages
6. Single source of truth in `profileBadges.tsx`

---

## Troubleshooting

### Badge doesn't appear after creation
- Check if badge is marked as "Active" (is_active = true)
- Refresh the profile page
- Check browser console for errors
- Verify badge in database using Supabase dashboard

### Icon shows as emoji instead of Lucide component
- Check if emoji is in `emojiToIconName` mapping
- Verify imports from `@/lib/profileBadges`
- Check for component import errors

### Badge metadata doesn't match between pages
- Verify both pages import from `@/lib/profileBadges`
- Check if `enhanceBadge()` is being used consistently
- Verify database description field contains valid JSON

### Changes in admin don't appear in profile
- Refresh the profile page (React Query caching)
- Check React Query DevTools for cache invalidation
- Verify mutation `onSuccess` invalidates correct queries

---

## Developer Notes

### Key Files to Check:
1. `src/lib/profileBadges.tsx` - Single source of truth
2. `src/components/profile/ProfileBadges.tsx` - Profile display
3. `src/routes/_authenticated/admin/badges.tsx` - Admin management
4. `src/routes/_authenticated/profile.tsx` - Profile page layout

### Query Keys to Monitor:
- `["profile-badges", "available"]` - Available badges
- `["user-badges"]` - User's earned badges
- `["admin", "profile-badges"]` - Admin badge list
- `["profile", "equipped-badge"]` - Currently equipped badge

### Mutation Invalidations:
- After create/edit/delete: Invalidate all badge queries
- After equip/unequip: Invalidate user badges and profile queries

---

Last Updated: June 4, 2026
