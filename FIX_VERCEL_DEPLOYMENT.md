# Fix: Local Changes Not Working on Vercel

## 🎯 Quick Diagnosis

Your latest changes (dashboard fix) are committed and pushed. If they work locally but not on Vercel, here's how to fix it:

## ✅ Step-by-Step Fix

### 1. Verify Latest Code is Deployed

**Check if your commit is on Vercel:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Check the latest deployment commit hash
3. Compare with: `git log -1` (should match)

**If commit doesn't match:**
- Vercel might not have pulled latest code
- Solution: Wait a few minutes or trigger redeploy

### 2. Clear Vercel Build Cache

**Why:** Vercel caches builds, which can show old code

**How:**
1. Go to Vercel Dashboard → Your Project → Settings
2. Scroll to "Build & Development Settings"
3. Click "Clear Build Cache"
4. Go to Deployments → Click "..." → "Redeploy"

### 3. Verify Environment Variables

**Critical:** Your `.env.local` is NOT used on Vercel!

**Check Vercel Dashboard → Settings → Environment Variables:**

**Required (must match your `.env.local`):**
```
VITE_FIREBASE_API_KEY=AIzaSyBJMTi18VKIZI9rS33I88Md0wywW7Mp_4Q
VITE_FIREBASE_AUTH_DOMAIN=chriscandle-e8cbd.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chriscandle-e8cbd
VITE_FIREBASE_STORAGE_BUCKET=chriscandle-e8cbd.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=542096921248
VITE_FIREBASE_APP_ID=1:542096921248:web:b2707d755c92854b232fc5
SENDGRID_API_KEY=YOUR_KEY_HERE
```

**⚠️ Important:** Never commit real API keys. Use environment variables in Vercel Dashboard.

**Important:**
- ✅ All variables must be set
- ✅ Enable for Production, Preview, AND Development
- ✅ After adding/updating, you MUST redeploy

### 4. Force Fresh Deployment

**Option A: Empty Commit (Recommended)**
```bash
git commit --allow-empty -m "force Vercel redeploy"
git push
```

**Option B: Redeploy from Dashboard**
1. Go to Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"

**Option C: Clear Cache + Redeploy**
1. Settings → Clear Build Cache
2. Deployments → Redeploy

### 5. Test Production Build Locally

**Before pushing, always test the production build:**
```bash
# Build production version
npm run build

# Preview it (simulates Vercel)
npm run preview

# Open http://localhost:4173
# Test your changes work here
```

If it works in `preview` but not on Vercel, it's likely:
- Environment variables missing
- Build cache issue
- CDN cache issue

### 6. Check Browser Console on Vercel

**Open your Vercel site and check console (F12):**

**Look for:**
- ✅ Firebase config logs (should show all values, not MISSING)
- ❌ Any red errors
- ❌ Network request failures
- ❌ 404 errors for API routes

**Compare with localhost:**
- Do you see the same logs?
- Are there different errors?
- Are environment variables loading?

## 🔍 Common Issues & Quick Fixes

### Issue: Dashboard events not showing

**Check:**
1. Browser console - are events being fetched?
2. Network tab - is the Firestore query succeeding?
3. Firebase config - are all variables loaded?

**Fix:**
- Verify all `VITE_FIREBASE_*` variables in Vercel
- Check browser console for errors
- Redeploy after adding variables

### Issue: API routes not working

**Check:**
1. Vercel Dashboard → Functions → `api/sendEmail`
2. Check "Logs" tab for errors
3. Test endpoint: `curl -X POST https://your-site.vercel.app/api/sendEmail ...`

**Fix:**
- Verify `SENDGRID_API_KEY` is set
- Check function logs for errors
- Ensure `@vercel/node` is in dependencies

### Issue: Changes not appearing

**Check:**
1. Is the latest commit deployed? (compare commit hashes)
2. Did you hard refresh? (Ctrl+Shift+R)
3. Is build cache cleared?

**Fix:**
- Clear build cache
- Force redeploy
- Hard refresh browser
- Wait 2-3 minutes for CDN to update

## 📋 Verification Checklist

After deploying, verify these work on Vercel:

- [ ] Homepage loads: `https://your-site.vercel.app/`
- [ ] Login works: Can sign in successfully
- [ ] Dashboard loads: `/dashboard` shows events
- [ ] Events display: Events appear after refresh
- [ ] Firebase works: No "not configured" errors
- [ ] API works: `/api/sendEmail` returns success
- [ ] Emails send: Test by joining an event

## 🚀 Recommended Workflow

**Every time you make changes:**

1. **Test locally:**
   ```bash
   npm run dev
   # Test your changes
   ```

2. **Build locally:**
   ```bash
   npm run build
   npm run preview
   # Test production build at localhost:4173
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "description"
   git push
   ```

4. **Monitor deployment:**
   - Check Vercel dashboard
   - Wait for "Ready" status
   - Check build logs for errors

5. **Test on Vercel:**
   - Visit your Vercel URL
   - Test all functionality
   - Check browser console

6. **If issues:**
   - Compare with localhost
   - Check environment variables
   - Check deployment logs
   - Clear cache and redeploy

## 💡 Key Takeaway

**The #1 reason local changes don't work on Vercel:**

**Missing or incorrect environment variables!**

Your `.env.local` file is NOT deployed to Vercel. You must manually add all variables in the Vercel Dashboard.

## 🔗 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Environment Variables:** Settings → Environment Variables
- **Deployments:** Deployments tab
- **Function Logs:** Functions → `api/sendEmail` → Logs
