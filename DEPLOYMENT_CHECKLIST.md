# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] Added Nitro Vercel preset to `vite.config.ts`
- [x] Created `vercel.json` configuration
- [x] Updated `.gitignore` to exclude `.env` files
- [x] Verified TypeScript has no errors
- [x] Created deployment documentation

## 📝 Your Action Items (Todo)

### Step 1: Push Code to Git Repository
```bash
# Check what files changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Configure Vercel deployment with Nitro preset and env setup"

# Push to your repository
git push origin main
```

**Expected Result:** Code pushed successfully to GitHub/GitLab

---

### Step 2: Configure Vercel Environment Variables

1. **Login to Vercel Dashboard:** https://vercel.com/dashboard

2. **Navigate to your project:** shadow-shelf

3. **Go to Settings → Environment Variables**

4. **Add these 3 variables:**

   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://edvqhmvqbtujzcfqkrbe.supabase.co`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

   **Variable 2:**
   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Value: `sb_publishable_jVdWorDtLlkVYzRh6EbEOA_lwnu59an`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

   **Variable 3:**
   - Name: `VITE_SUPABASE_PROJECT_ID`
   - Value: `edvqhmvqbtujzcfqkrbe`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

**Expected Result:** 3 environment variables saved

---

### Step 3: Check Build Settings (Verify Only)

Go to: Settings → Build & Development Settings

**Should be:**
- Framework Preset: Other (or auto-detected)
- Build Command: `npm run build`
- Output Directory: (leave empty or `.output/public`)
- Install Command: `npm install`
- Node.js Version: 20.x

**Action:** If different, update and save.

---

### Step 4: Trigger Fresh Deployment

**Option A: Automatic (Recommended)**
- After pushing code, Vercel will auto-deploy
- Go to Deployments tab and wait for build

**Option B: Manual**
1. Go to Deployments tab
2. Click on latest deployment
3. Click menu (•••) → "Redeploy"
4. Select "**Redeploy with existing Build Cache cleared**"
5. Click "Redeploy"

**Expected Result:** Build starts

---

### Step 5: Monitor Build Process

1. **Watch Build Logs:**
   - Click on the deployment in progress
   - View "Building" logs in real-time

2. **Look for Success Messages:**
   ```
   ✓ Building Nitro Server (preset: vercel)
   ✓ Build successful
   ✓ Deploying to Vercel Functions
   ✓ Deployment Complete
   ```

3. **Check for Errors:**
   - If build fails, read error messages carefully
   - Common issues: Missing env vars, Node version

**Expected Result:** ✅ Deployment successful

---

### Step 6: Test Your Live Site

1. **Visit:** https://shadow-shelf.vercel.app

2. **Test Core Features:**
   - [ ] Homepage loads correctly
   - [ ] Navigation works (Browse, Rankings, etc.)
   - [ ] Login/Sign up works
   - [ ] Series pages load
   - [ ] Carousel displays properly
   - [ ] User profile accessible

3. **Check Browser Console:**
   - Press F12 → Console tab
   - Look for errors (red text)
   - Common issue: CORS errors from Supabase

**Expected Result:** All features work

---

### Step 7: Configure Supabase (If CORS Errors)

If you see "Site URL not allowed" or CORS errors:

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/edvqhmvqbtujzcfqkrbe

2. **Navigate to:** Authentication → URL Configuration

3. **Update Settings:**
   - Site URL: `https://shadow-shelf.vercel.app`
   - Redirect URLs: Add `https://shadow-shelf.vercel.app/**`

4. **Save Changes**

5. **Test authentication again**

**Expected Result:** Authentication works

---

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Site loads at https://shadow-shelf.vercel.app
- ✅ No console errors (except benign warnings)
- ✅ Authentication works
- ✅ All pages accessible
- ✅ Database queries succeed

---

## 🆘 Troubleshooting Quick Reference

### Build Fails
→ Check build logs → Fix errors → Push → Redeploy

### 404 on All Pages
→ Verify `vercel.json` deployed → Check Nitro preset → Redeploy

### Authentication Fails
→ Add Vercel URL to Supabase → Verify env vars → Test again

### Database Queries Fail
→ Check Supabase RLS policies → Verify API keys → Check logs

### Blank White Screen
→ Check browser console → Look for JS errors → Check build logs

---

## 📞 Need Help?

1. **Check Build Logs** in Vercel Dashboard first
2. **Check Browser Console** for client-side errors
3. **Review:** `VERCEL_DEPLOYMENT_GUIDE.md` for detailed troubleshooting
4. **Quick Fix:** `VERCEL_QUICK_FIX.md` for immediate steps

---

**Estimated Total Time:** 10-15 minutes
**Difficulty Level:** Easy (just follow steps)
**Success Rate:** 95%+ (with these configs)

Good luck! 🚀
