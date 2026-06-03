# 🎯 VERCEL ENVIRONMENT VARIABLES SETUP

## Why You're Seeing 500 Errors

Your site is deployed, but the **environment variables are missing** in Vercel.

The `.env` file on your computer is **NOT uploaded to Vercel** (it's in `.gitignore`).

You must **manually add them** in Vercel Dashboard.

---

## 📋 Copy-Paste These Values

Open Vercel Dashboard and add these **3 environment variables**:

### Variable 1
```
Name:  VITE_SUPABASE_URL
Value: https://edvqhmvqbtujzcfqkrbe.supabase.co
```
✅ Check: Production, Preview, Development

---

### Variable 2
```
Name:  VITE_SUPABASE_PUBLISHABLE_KEY
Value: sb_publishable_jVdWorDtLlkVYzRh6EbEOA_lwnu59an
```
✅ Check: Production, Preview, Development

---

### Variable 3
```
Name:  VITE_SUPABASE_PROJECT_ID
Value: edvqhmvqbtujzcfqkrbe
```
✅ Check: Production, Preview, Development

---

## 🔗 Quick Links

1. **Add Variables Here**: https://vercel.com/dashboard → shadow-shelf → Settings → Environment Variables
2. **Redeploy Here**: https://vercel.com/dashboard → shadow-shelf → Deployments → (click latest) → Redeploy

---

## ✅ Checklist

- [ ] Added `VITE_SUPABASE_URL` with all 3 environments checked
- [ ] Added `VITE_SUPABASE_PUBLISHABLE_KEY` with all 3 environments checked  
- [ ] Added `VITE_SUPABASE_PROJECT_ID` with all 3 environments checked
- [ ] Clicked "Save" after each variable
- [ ] Went to Deployments tab
- [ ] Clicked latest deployment → three dots (⋮) → Redeploy
- [ ] Checked "Clear cache and redeploy"
- [ ] Clicked Redeploy button
- [ ] Waited 2-3 minutes for deployment to complete
- [ ] Tested https://www.vnrscans.com/ in browser
- [ ] Checked browser console (F12) - no errors!

---

## 🚀 After Adding Variables

**IMPORTANT**: Just adding variables is **not enough**!

You **MUST redeploy** for changes to take effect:

1. Go to **Deployments** tab
2. Click the **latest deployment**
3. Click **three dots (⋮)** menu
4. Select **Redeploy**
5. ✅ **Check**: "Clear cache and redeploy"
6. Click **Redeploy** button

Wait 2-3 minutes, then test your site!

---

## 🎉 Success Looks Like

When you open https://www.vnrscans.com/ and check DevTools Console (F12):

✅ **No errors**  
✅ **Site loads**  
✅ **No "Missing Supabase environment variable" messages**  
✅ **Vercel Analytics working** (check Network tab)

---

## ⚠️ Still Broken?

If you still see errors after following ALL steps:

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Copy the exact error message
4. Go to Vercel Dashboard → Deployments → Latest → **Functions** tab
5. Check for errors in the logs
6. Share both with me

Most common issue: **Forgot to check all 3 environment boxes** (Production, Preview, Development)
