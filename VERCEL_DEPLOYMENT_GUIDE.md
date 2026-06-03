# Vercel Deployment Guide for Shadow Shelf

## ⚠️ Important: TanStack Start + Vercel Setup

Your app uses **TanStack Start** (a full-stack React framework with SSR), which requires specific Vercel configuration.

## 🔧 Configuration Applied

### 1. **vite.config.ts** - Updated
Added Nitro preset for Vercel:
```typescript
nitro: {
  preset: "vercel",
}
```

### 2. **vercel.json** - Created
Basic Vercel configuration for build settings.

## 🚀 Deployment Steps

### Step 1: Push Changes to Git
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push
```

### Step 2: Configure Environment Variables in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

**Required Variables:**
```
VITE_SUPABASE_URL=https://edvqhmvqbtujzcfqkrbe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_jVdWorDtLlkVYzRh6EbEOA_lwnu59an
VITE_SUPABASE_PROJECT_ID=edvqhmvqbtujzcfqkrbe
```

**Important:** Add these to all environments (Production, Preview, Development)

### Step 3: Configure Build Settings

In Vercel Dashboard → Project Settings → Build & Development Settings:

- **Framework Preset:** Other (or leave as detected)
- **Build Command:** `npm run build`
- **Output Directory:** `.output/public` (leave empty to auto-detect)
- **Install Command:** `npm install`
- **Node Version:** 20.x (recommended)

### Step 4: Redeploy

After adding environment variables:
1. Go to Deployments tab
2. Find the latest deployment
3. Click the three dots (•••) → Redeploy
4. Select "Redeploy with existing Build Cache cleared"

## 🔍 Troubleshooting

### If Site Shows 404 or Blank Page:

1. **Check Build Logs:**
   - Go to Vercel Dashboard → Deployments → Click latest deployment
   - Look for errors in build logs
   - Common issues: Missing environment variables, build failures

2. **Check Function Logs:**
   - Go to Vercel Dashboard → Logs
   - Look for runtime errors
   - Check if SSR functions are deploying correctly

3. **Verify Environment Variables:**
   - Go to Settings → Environment Variables
   - Ensure all three variables are set for all environments
   - Click "Redeploy" after adding/updating variables

4. **Check Package.json Build Command:**
   - Ensure `"build": "vite build"` exists in scripts
   - Vercel will run this command

### If Build Fails:

1. **Check Node Version:**
   - TanStack Start requires Node 18+ (20.x recommended)
   - Set in Project Settings → General → Node.js Version

2. **Clear Build Cache:**
   - Go to latest deployment → Redeploy → Clear cache

3. **Check for TypeScript Errors:**
   - Run locally: `npm run build`
   - Fix any errors before deploying

## 📝 Alternative: Simple SPA Deployment

If SSR isn't required, you can convert to a simple SPA:

1. **Disable SSR in vite.config.ts:**
```typescript
export default defineConfig({
  vite: {
    build: {
      outDir: 'dist',
    },
  },
});
```

2. **Update vercel.json:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

3. **Use standard React build** instead of TanStack Start

## ✅ Verification

After successful deployment:
1. Visit your Vercel URL (e.g., https://shadow-shelf.vercel.app)
2. Check that the homepage loads
3. Test authentication with Supabase
4. Verify all features work correctly

## 🆘 Still Not Working?

Common causes:
- ❌ Missing environment variables in Vercel
- ❌ Wrong build command or output directory
- ❌ Supabase RLS policies blocking requests from Vercel domain
- ❌ CORS issues with Supabase

**Solution:** Add Vercel domain to Supabase allowed origins:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Site URL" and "Redirect URLs"
3. Redeploy on Vercel

---

## 📧 Need More Help?

Check Vercel deployment logs for specific error messages, or share them for detailed troubleshooting.
