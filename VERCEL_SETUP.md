# Vercel Deployment Setup Guide

## Environment Variables Required

You need to add these environment variables in your Vercel project settings:

1. Go to: https://vercel.com/your-username/shadow-shelf/settings/environment-variables

2. Add the following variables:

### Supabase Configuration
```
SUPABASE_URL=https://edvqhmvqbtujzcfqkrbe.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_jVdWorDtLlkVYzRh6EbEOA_lwnu59an
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdnFobXZxYnR1anpjZnFrcmJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMTAwNywiZXhwIjoyMDk1OTg3MDA3fQ.MqI03hN33fKy0xbqlSg3WYXfYw28KT6nFZfYPjKrEp8

VITE_SUPABASE_URL=https://edvqhmvqbtujzcfqkrbe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_jVdWorDtLlkVYzRh6EbEOA_lwnu59an
VITE_SUPABASE_PROJECT_ID=edvqhmvqbtujzcfqkrbe
```

**Important:** Make sure to add these to ALL environments (Production, Preview, Development)

## Deployment Steps

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Fix: Add Vercel Analytics and update configuration"
   git push origin main
   ```

2. **Redeploy on Vercel:**
   - Go to your Vercel dashboard
   - Click on your project
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - OR it will auto-deploy when you push

3. **Check Build Logs:**
   - Monitor the build process in Vercel dashboard
   - Look for any errors during build or runtime

## Common Issues & Solutions

### 500 Internal Server Error
- **Cause:** Missing environment variables or build errors
- **Solution:** Verify all env vars are set in Vercel dashboard

### 404 NOT_FOUND
- **Cause:** Incorrect routing or deployment not found
- **Solution:** Ensure latest deployment is active and domain is properly configured

### Deployment Not Found
- **Cause:** Domain not properly linked or deployment deleted
- **Solution:** 
  1. Go to Project Settings > Domains
  2. Verify vnrscans.com is correctly configured
  3. Check DNS settings point to Vercel

## Verifying Deployment

After deployment, test these URLs:
- https://www.vnrscans.com/
- https://shadow-shelf.vercel.app/
- https://www.vnrscans.com/auth
- https://www.vnrscans.com/library

All should load without 500 errors.

## Need Help?

If errors persist:
1. Check Vercel build logs
2. Check browser console for client-side errors
3. Verify Supabase is accessible from Vercel's servers
