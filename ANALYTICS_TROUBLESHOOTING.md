# Firebase Analytics Troubleshooting Guide

## Error: "API key not valid. Please pass a valid API key (analytics/config-fetch-failed)"

This error occurs when Firebase Analytics cannot validate your API key. Follow these steps to resolve it:

## Step 1: Verify Firebase API Key

1. **Go to Firebase Console:**
   - Navigate to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `chriscandle-e8cbd`

2. **Get the Web API Key:**
   - Go to **Project Settings** (gear icon) → **General** tab
   - Scroll to **Your apps** section
   - Find your web app or click **Add app** → **Web** if needed
   - Copy the **Web API Key** (starts with `AIzaSy...`)

3. **Update `.env.local`:**
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...  # Replace with the actual key from Firebase Console
   ```

4. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

## Step 2: Check API Key Restrictions

If your API key has restrictions, they might be blocking Analytics API calls:

1. **Go to Google Cloud Console:**
   - Navigate to [Google Cloud Console](https://console.cloud.google.com/)
   - Select project: `chriscandle-e8cbd`

2. **Check API Key Restrictions:**
   - Go to **APIs & Services** → **Credentials**
   - Find your API key (the one starting with `AIzaSy...`)
   - Click on it to view details

3. **Verify API Restrictions:**
   - **Application restrictions:** Should allow your domain or be set to "None"
   - **API restrictions:** Should include:
     - ✅ **Firebase Installations API**
     - ✅ **Firebase Remote Config API** (if using)
     - ✅ **Google Analytics Data API** (if using Analytics)
     - OR set to "Don't restrict key" for development

4. **If restricted, either:**
   - Add the required APIs to the restrictions list
   - OR create a separate API key for development without restrictions

## Step 3: Enable Google Analytics in Firebase

Firebase Analytics requires Google Analytics to be enabled:

1. **Go to Firebase Console:**
   - Navigate to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `chriscandle-e8cbd`

2. **Check Analytics Integration:**
   - Go to **Project Settings** (gear icon) → **Integrations** tab
   - Look for **Google Analytics**
   - If not enabled, click **Enable** or **Link**

3. **Create/Select Analytics Account:**
   - If prompted, create a new Google Analytics account or link an existing one
   - Select the Analytics account and property

4. **Wait for propagation:**
   - Changes may take a few minutes to propagate
   - Restart your dev server after enabling

## Step 4: Verify Environment Variables

Check that all Firebase config values are correctly set in `.env.local`:

```env
# Required
VITE_FIREBASE_API_KEY=AIzaSy...                    # Web API Key from Firebase Console
VITE_FIREBASE_AUTH_DOMAIN=chriscandle-e8cbd.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chriscandle-e8cbd

# Optional but recommended
VITE_FIREBASE_STORAGE_BUCKET=chriscandle-e8cbd.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=542096921248
VITE_FIREBASE_APP_ID=1:542096921248:web:b2707d755c92854b232fc5
VITE_FIREBASE_DATABASE_URL=https://chriscandle-e8cbd-default-rtdb.asia-southeast1.firebasedatabase.app
```

**Important:**
- The API key must match exactly what's in Firebase Console
- No extra spaces or quotes around values
- Restart dev server after changing `.env.local`

## Step 5: Check Browser Console

Open browser DevTools (F12) and check for:

1. **Firebase Config Logs:**
   ```
   🔍 Firebase Config Check:
     - API Key: AIzaSyBJMT...
     - Auth Domain: chriscandle-e8cbd.firebaseapp.com
     - Project ID: chriscandle-e8cbd
   ```

2. **Analytics Initialization:**
   - ✅ Success: `✅ Firebase Analytics initialized successfully`
   - ❌ Error: Look for specific error messages

3. **Network Tab:**
   - Check for failed requests to `analytics.googleapis.com`
   - Look for 400/401/403 errors

## Step 6: Temporarily Disable Analytics

If Analytics is not required, you can disable it:

1. **Add to `.env.local`:**
   ```env
   VITE_ENABLE_ANALYTICS=false
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **Verify:**
   - Check console for: `ℹ️ Firebase Analytics is disabled`
   - App should work normally without Analytics

## Common Issues

### Issue: "API key not valid" but key looks correct

**Possible causes:**
- API key has restrictions that block Analytics API
- Wrong API key (using iOS/Android key instead of Web key)
- API key was regenerated but `.env.local` wasn't updated

**Solution:**
1. Verify you're using the **Web API Key** from Firebase Console
2. Check API key restrictions in Google Cloud Console
3. Try creating a new API key without restrictions for testing

### Issue: Analytics works locally but fails in production

**Possible causes:**
- Environment variables not set in deployment platform (Vercel, Netlify, etc.)
- API key restrictions blocking production domain

**Solution:**
1. Set `VITE_FIREBASE_API_KEY` in your deployment platform's environment variables
2. Add your production domain to API key restrictions
3. Redeploy after setting environment variables

### Issue: Analytics fails after SendGrid API key cancellation

**Unlikely related:**
- SendGrid and Firebase use different API keys
- Check that `.env.local` wasn't accidentally modified
- Verify Firebase API key is still correct

**Solution:**
1. Re-verify Firebase API key in Firebase Console
2. Check that `.env.local` wasn't corrupted
3. Restart dev server

## Verification Checklist

After fixing, verify:

- [ ] Firebase API key matches Firebase Console → Project Settings → General → Web API Key
- [ ] All required environment variables are set in `.env.local`
- [ ] Dev server was restarted after changing `.env.local`
- [ ] Google Analytics is enabled in Firebase Console → Project Settings → Integrations
- [ ] API key restrictions allow Analytics API calls (or restrictions are disabled)
- [ ] Browser console shows `✅ Firebase Analytics initialized successfully`
- [ ] No 400/401/403 errors in Network tab for Analytics requests

## Still Having Issues?

1. **Check Firebase Status:**
   - Visit [Firebase Status Page](https://status.firebase.google.com/)

2. **Review Firebase Documentation:**
   - [Firebase Analytics Setup](https://firebase.google.com/docs/analytics/get-started?platform=web)

3. **Test with minimal config:**
   - Create a new Firebase project
   - Copy the Web API Key
   - Test if Analytics works with the new project

4. **Disable Analytics temporarily:**
   - Add `VITE_ENABLE_ANALYTICS=false` to `.env.local`
   - App will work without Analytics

## Related Files

- `src/lib/firebase.ts` - Firebase configuration
- `src/lib/analytics.ts` - Analytics initialization
- `src/main.tsx` - App entry point (calls `initAnalytics()`)
- `.env.local` - Environment variables (not committed to Git)
