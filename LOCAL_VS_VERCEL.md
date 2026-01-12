# Localhost vs Vercel: Key Differences

## Why Changes Work Locally But Not on Vercel

### 1. Environment Variables

**Localhost:**
- Uses `.env.local` file (in project root)
- Automatically loaded by Vite
- File is gitignored (not in repo)

**Vercel:**
- Uses environment variables set in Vercel Dashboard
- Must be manually added in Settings → Environment Variables
- Not automatically synced from `.env.local`

**Solution:** Copy all variables from `.env.local` to Vercel Dashboard

### 2. Build Process

**Localhost:**
- `npm run dev` - Development mode
- Hot module replacement
- Source maps enabled
- Faster builds

**Vercel:**
- `npm run build` - Production mode
- Optimized/minified code
- No source maps (usually)
- Full build every deployment

**Solution:** Always test `npm run build` locally before pushing

### 3. API Routes

**Localhost:**
- Vite dev server handles `/api/*` routes
- May need Vercel CLI for local testing: `vercel dev`

**Vercel:**
- Serverless functions in `api/` directory
- Automatically deployed as functions
- Must have `@vercel/node` dependency

**Solution:** Test API routes on Vercel deployment, not just localhost

### 4. Caching

**Localhost:**
- No caching (fresh on every refresh)
- Browser cache can be cleared easily

**Vercel:**
- Aggressive caching (CDN, browser, build cache)
- May show old version after deployment

**Solution:** 
- Hard refresh (Ctrl+Shift+R)
- Clear Vercel build cache
- Wait a few minutes for CDN to update

### 5. Code Deployment

**Localhost:**
- Changes are immediate (hot reload)
- No deployment step needed

**Vercel:**
- Changes require git push
- Deployment takes 1-3 minutes
- Must wait for deployment to complete

**Solution:** 
- Always push code: `git push`
- Check deployment status in Vercel dashboard
- Wait for "Ready" status before testing

## 🔧 Quick Fix Checklist

If your changes work locally but not on Vercel:

### Step 1: Verify Code is Deployed
```bash
# Check latest commit
git log -1

# Verify it's pushed
git status
# Should say "Your branch is up to date with 'origin/main'"
```

### Step 2: Check Vercel Deployment
1. Go to Vercel Dashboard → Your Project → Deployments
2. Check latest deployment:
   - ✅ Green "Ready" = Deployed successfully
   - ❌ Red "Error" = Check build logs

### Step 3: Verify Environment Variables
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Compare with your `.env.local`:
   - All `VITE_FIREBASE_*` variables present?
   - `SENDGRID_API_KEY` set?
   - All enabled for Production?

### Step 4: Force Redeploy
If deployment succeeded but changes aren't showing:

1. **Clear Build Cache:**
   - Settings → General → Clear Build Cache
   - Redeploy

2. **Or Redeploy Manually:**
   - Deployments → "..." → Redeploy

3. **Or Push Empty Commit:**
   ```bash
   git commit --allow-empty -m "force redeploy"
   git push
   ```

### Step 5: Test Production Build Locally
```bash
# Build production version
npm run build

# Preview production build
npm run preview

# Test at http://localhost:4173
# This simulates Vercel production
```

### Step 6: Check Browser Console
1. Open your Vercel site
2. Open browser console (F12)
3. Look for:
   - Errors (red text)
   - Firebase config logs
   - Network request failures

## 🚨 Common Issues

### Issue: "Changes not showing"
**Cause:** Build cache or CDN cache
**Fix:** Clear cache + redeploy

### Issue: "Firebase not working"
**Cause:** Missing environment variables
**Fix:** Add all `VITE_FIREBASE_*` vars to Vercel

### Issue: "API routes 404"
**Cause:** Function not deployed or routing issue
**Fix:** Check `vercel.json` and function logs

### Issue: "Build fails"
**Cause:** TypeScript errors or missing deps
**Fix:** Test `npm run build` locally first

## ✅ Best Practices

1. **Always test build locally:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Keep env vars in sync:**
   - Local: `.env.local`
   - Production: Vercel Dashboard

3. **Check deployment logs:**
   - Always review build logs after deployment
   - Check for warnings or errors

4. **Test on production:**
   - Don't assume localhost = production
   - Always test on Vercel URL after deployment

5. **Use git properly:**
   - Commit all changes
   - Push to trigger deployment
   - Check deployment status

## 📝 Deployment Workflow

**Every time you make changes:**

1. ✅ Test locally: `npm run dev`
2. ✅ Build locally: `npm run build` (fix any errors)
3. ✅ Commit: `git add . && git commit -m "message"`
4. ✅ Push: `git push`
5. ✅ Wait: Check Vercel dashboard for deployment
6. ✅ Test: Visit Vercel URL and test functionality
7. ✅ Debug: If issues, check logs and console

## 🔍 Debugging Production

**If something works locally but not on Vercel:**

1. **Compare environments:**
   - Check browser console on both
   - Compare network requests
   - Check for different error messages

2. **Check Vercel logs:**
   - Build logs (deployment page)
   - Function logs (Functions tab)
   - Runtime logs (if available)

3. **Test production build locally:**
   ```bash
   npm run build
   npm run preview
   # Test at localhost:4173
   ```

4. **Verify environment:**
   - Check `import.meta.env.PROD` value
   - Check which email provider is used
   - Verify API endpoints

## 💡 Pro Tip

**Always test the production build locally before pushing:**
```bash
npm run build && npm run preview
```

This catches most issues before they reach Vercel!
