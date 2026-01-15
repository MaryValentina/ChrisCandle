# Vercel Deployment Checklist

This checklist ensures your local changes work on Vercel.

## ✅ Pre-Deployment Checklist

### 1. Code is Committed and Pushed
```bash
# Check if you have uncommitted changes
git status

# If you have changes, commit and push
git add .
git commit -m "your commit message"
git push
```

### 2. Environment Variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

**Required Firebase Variables:**
- ✅ `VITE_FIREBASE_API_KEY` = `AIzaSyBJMTi18VKIZI9rS33I88Md0wywW7Mp_4Q`
- ✅ `VITE_FIREBASE_AUTH_DOMAIN` = `chriscandle-e8cbd.firebaseapp.com`
- ✅ `VITE_FIREBASE_PROJECT_ID` = `chriscandle-e8cbd`
- ✅ `VITE_FIREBASE_STORAGE_BUCKET` = `chriscandle-e8cbd.firebasestorage.app`
- ✅ `VITE_FIREBASE_MESSAGING_SENDER_ID` = `542096921248`
- ✅ `VITE_FIREBASE_APP_ID` = `1:542096921248:web:b2707d755c92854b232fc5`

**Required SendGrid Variables:**
- ✅ `SENDGRID_API_KEY` = `YOUR_KEY_HERE` (get from SendGrid dashboard)
- ✅ `SENDGRID_FROM_EMAIL` = `mvalentina1990@outlook.com` (optional, has default)

**⚠️ Important:** Never commit real API keys. Use environment variables in Vercel Dashboard.

**Important:** 
- Select **Production**, **Preview**, and **Development** for each variable
- After adding/updating variables, you MUST redeploy

### 3. Verify Build Configuration

Check `vercel.json`:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

Check `package.json` scripts:
```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

### 4. API Routes Configuration

Verify `api/sendEmail.ts` exists and is properly configured.

## 🔄 After Pushing Changes

### 1. Check Vercel Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Deployments** tab
4. Check the latest deployment:
   - ✅ Status should be "Ready" (green)
   - ❌ If "Error" or "Failed", click to see build logs

### 2. If Deployment Failed

**Check Build Logs:**
- Click on the failed deployment
- Scroll to "Build Logs"
- Look for errors (usually red text)
- Common issues:
  - Missing dependencies
  - TypeScript errors
  - Build command failures

**Common Fixes:**
```bash
# If dependencies are missing, ensure package.json is up to date
npm install

# If build fails, test locally first
npm run build

# Commit and push again
git add .
git commit -m "fix build issues"
git push
```

### 3. Force Redeploy

If changes aren't showing:

1. **Option A: Redeploy from Dashboard**
   - Go to Deployments
   - Click "..." on latest deployment
   - Click "Redeploy"

2. **Option B: Push Empty Commit**
   ```bash
   git commit --allow-empty -m "trigger redeploy"
   git push
   ```

3. **Option C: Clear Build Cache**
   - Go to Settings → General
   - Scroll to "Build & Development Settings"
   - Click "Clear Build Cache"
   - Redeploy

## 🐛 Debugging Production Issues

### 1. Check Browser Console

Open your Vercel site and check browser console (F12):
- Look for errors (red text)
- Check Firebase config logs
- Verify environment variables are loaded

### 2. Check Vercel Function Logs

For API routes (`/api/sendEmail`):
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `api/sendEmail`
3. Check "Logs" tab for errors

### 3. Compare Local vs Production

**Local (localhost):**
- Uses `.env.local` file
- Development mode (`import.meta.env.DEV = true`)
- Email provider: `mock` (default)

**Production (Vercel):**
- Uses Vercel environment variables
- Production mode (`import.meta.env.PROD = true`)
- Email provider: `vercel` (default)

### 4. Test API Endpoint

Test if `/api/sendEmail` works:
```bash
curl -X POST https://your-project.vercel.app/api/sendEmail \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<h1>Test</h1>"
  }'
```

Should return: `{"success": true}`

## 🔍 Common Issues & Solutions

### Issue: Changes not showing on Vercel

**Solution:**
1. Verify code is pushed: `git log` (check latest commit)
2. Check deployment status in Vercel dashboard
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Clear browser cache
5. Force redeploy

### Issue: Firebase not working

**Solution:**
1. Verify all `VITE_FIREBASE_*` variables are set in Vercel
2. Check they're enabled for Production environment
3. Redeploy after adding variables
4. Check browser console for config errors

### Issue: API routes returning 404

**Solution:**
1. Verify `api/sendEmail.ts` exists
2. Check `vercel.json` has correct routing
3. Ensure `@vercel/node` is in `package.json` dependencies
4. Check function logs in Vercel dashboard

### Issue: Emails not sending

**Solution:**
1. Verify `SENDGRID_API_KEY` is set in Vercel
2. Check function logs for errors
3. Verify sender email is verified in SendGrid
4. Test API endpoint directly (see above)

### Issue: Dashboard not loading events

**Solution:**
1. Check browser console for errors
2. Verify Firebase environment variables
3. Check network tab for failed requests
4. Verify user is authenticated

## 📋 Quick Verification Steps

After deploying, verify:

1. ✅ **Homepage loads** - `https://your-project.vercel.app/`
2. ✅ **Login works** - Can sign in
3. ✅ **Dashboard loads** - `/dashboard` shows events
4. ✅ **Events display** - Events appear after refresh
5. ✅ **API works** - `/api/sendEmail` returns success
6. ✅ **Emails send** - Test by joining an event

## 🚀 Deployment Workflow

**Every time you make changes:**

1. **Test locally first:**
   ```bash
   npm run dev
   # Test your changes work
   ```

2. **Build locally to catch errors:**
   ```bash
   npm run build
   # Fix any build errors
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "description of changes"
   git push
   ```

4. **Monitor deployment:**
   - Check Vercel dashboard
   - Wait for deployment to complete
   - Test on production URL

5. **If issues:**
   - Check build logs
   - Check function logs
   - Check browser console
   - Compare with localhost behavior

## 💡 Pro Tips

1. **Always test build locally** before pushing
2. **Check Vercel deployment logs** if something fails
3. **Use browser console** to debug production issues
4. **Keep environment variables in sync** between local and Vercel
5. **Redeploy after changing environment variables**
