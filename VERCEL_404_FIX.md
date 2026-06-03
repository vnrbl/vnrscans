# 🚨 Vercel 404 Fix - TanStack Start Deployment

## Problem

You're getting `404: NOT_FOUND` because TanStack Start with Nitro has complex routing that Vercel doesn't handle automatically.

## 🎯 Solution Options

You have **3 options** to fix this:

---

## ✅ OPTION 1: Use Cloudflare Pages (Recommended - Easiest)

TanStack Start works **natively** with Cloudflare Pages (Nitro's default target).

### Steps:

1. **Create Cloudflare Pages Project:**
   - Go to: https://pages.cloudflare.com/
   - Click "Create a project"
   - Connect your Git repository

2. **Configure Build Settings:**
   - Build command: `npm run build`
   - Build output directory: `.output/public`
   - Environment variables: Add the 3 VITE_SUPABASE_* variables

3. **Deploy**
   - Your site will work immediately on Cloudflare Pages!

**Advantages:**
- ✅ Native support for Nitro
- ✅ No configuration needed
- ✅ Faster deployments
- ✅ Better SSR performance

---

## ✅ OPTION 2: Switch to Vercel Node.js Runtime (More Work)

Modify your app to use Vercel's Node.js functions directly.

### Steps:

1. **Install Vercel Adapter:**
```bash
npm install @astrojs/vercel
```

2. **Update vite.config.ts:**
```typescript
export default defineConfig({
  nitro: {
    preset: "vercel",
    serveStatic: true,
  },
  // ... rest of config
});
```

3. **Add Build Configuration:**

Create `.vercelignore`:
```
node_modules
.git
```

4. **Environment Variables:**
Add all VITE_* variables in Vercel Dashboard

5. **Redeploy**

---

## ✅ OPTION 3: Deploy as Static SPA (Simplest, No SSR)

Convert to a client-side only app (loses SSR benefits).

### Steps:

1. **Update package.json:**
```json
{
  "scripts": {
    "build": "vite build --mode production"
  }
}
```

2. **Create new vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

3. **Update vercel.json:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

4. **Create src/index.html:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>0Verse - Shadow Shelf</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/start.ts"></script>
  </body>
</html>
```

5. **Redeploy**

**Disadvantages:**
- ❌ Loses SSR (slower initial load)
- ❌ Worse SEO
- ❌ No server-side features

---

## 🎯 My Recommendation

**Use Cloudflare Pages (Option 1)**

Why?
- TanStack Start is built for Cloudflare
- Zero configuration needed
- Better performance for SSR
- Free tier is generous
- 5-minute setup

### Quick Cloudflare Setup:

1. Go to https://pages.cloudflare.com/
2. Connect your GitHub repo
3. Build command: `npm run build`
4. Build output: `.output/public`
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
6. Deploy!

Your site will be live at: `shadow-shelf.pages.dev`

---

## 🔧 Current Vercel Issue Explained

The 404 happens because:
1. Vercel expects specific function structure
2. Nitro generates Cloudflare Worker format by default
3. The `vercel` preset exists but has compatibility issues
4. TanStack Start + Vercel needs custom server setup

**Bottom line:** Cloudflare Pages is the path of least resistance for TanStack Start apps.

---

## 📊 Platform Comparison

| Feature | Cloudflare Pages | Vercel (with fixes) | Vercel (SPA) |
|---------|------------------|---------------------|--------------|
| Setup Time | 5 min | 30+ min | 15 min |
| SSR Support | ✅ Native | ⚠️ Complex | ❌ No |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Configuration | None | Heavy | Light |
| Cost | Free | Free | Free |

---

## 🆘 Still Want Vercel?

If you **must** use Vercel with SSR, here's what you need to debug:

1. **Check Build Logs:**
   - Look for `.output` directory creation
   - Verify serverless functions are generated

2. **Check Function Routes:**
   - Vercel Dashboard → Functions tab
   - Should see `index.func` or similar

3. **Inspect Build Output:**
   - Download build artifacts
   - Check `.vercel/output/` structure

4. **Try Node.js Runtime:**
   - May need custom Vercel build config
   - Requires advanced Nitro configuration

---

## ✅ Next Steps

**Recommended:** Try Cloudflare Pages first. It'll work in 5 minutes.

**If you need Vercel:** Try Option 3 (SPA mode) for quick deployment without SSR.

**For full SSR on Vercel:** This requires custom Nitro configuration and debugging. Let me know if you want to pursue this route.

---

Would you like me to:
1. Set up Cloudflare Pages configuration?
2. Convert to SPA mode for Vercel?
3. Deep-dive into Vercel SSR debugging?
