# Fix SendGrid API Key Error

## Error: "The provided authorization grant is invalid, expired, or revoked"

This error means your SendGrid API key in Vercel is either missing, invalid, or was cancelled.

## Quick Fix Steps

### Step 1: Get a New SendGrid API Key

1. **Go to SendGrid Dashboard:**
   - Navigate to [SendGrid Dashboard](https://app.sendgrid.com/)
   - Log in to your account

2. **Create a New API Key:**
   - Go to **Settings** → **API Keys**
   - Click **Create API Key**
   - Name it (e.g., "ChrisCandle Vercel")
   - Select **Full Access** or **Restricted Access** with "Mail Send" permissions
   - **Copy the API key immediately** (you won't be able to see it again!)
   - Format: `SG.xxxxxxxxxxxxx...`

### Step 2: Update Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Navigate to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project: **ChrisCandle**

2. **Update Environment Variables:**
   - Go to **Settings** → **Environment Variables**
   - Find `SENDGRID_API_KEY`
   - Click **Edit** or **Add** if it doesn't exist
   - Paste your new SendGrid API key
   - **Important:** Select **Production**, **Preview**, and **Development** environments
   - Click **Save**

3. **Optional - Set From Email:**
   - Find or add `SENDGRID_FROM_EMAIL`
   - Set value to: `mvalentina1990@outlook.com` (or your verified sender email)
   - Select all environments
   - Click **Save**

### Step 3: Redeploy Your Application

**After updating environment variables, you MUST redeploy:**

1. **Option A: Redeploy from Dashboard**
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment
   - Click **Redeploy**

2. **Option B: Trigger via Git Push**
   ```bash
   git commit --allow-empty -m "trigger redeploy for SendGrid key update"
   git push
   ```

3. **Option C: Force Redeploy**
   - Go to **Settings** → **General**
   - Scroll to **Build & Development Settings**
   - Click **Clear Build Cache**
   - Then redeploy from Deployments tab

### Step 4: Verify the Fix

1. **Test Email Sending:**
   - Try adding a participant to an event
   - Check browser console for success messages
   - Check that emails are received

2. **Check Vercel Function Logs:**
   - Go to **Deployments** → Latest deployment
   - Click on **Functions** tab
   - Click on `api/sendEmail`
   - Check **Logs** tab for any errors

3. **Expected Success Logs:**
   ```
   ✅ Email sent successfully to user@example.com
   ```

## Important Notes

### Security Best Practices

- ✅ **DO:** Store SendGrid API key in Vercel environment variables (server-side only)
- ❌ **DON'T:** Put SendGrid API key in `.env.local` or client-side code
- ❌ **DON'T:** Commit SendGrid API key to Git
- ✅ **DO:** Use different API keys for development and production if needed

### Why Client-Side Shows `undefined`

The logs showing `SendGrid API Key: undefined` in the browser console are **expected and correct**:

- SendGrid API key is **server-side only** (in Vercel function)
- Client-side code should **never** have access to it
- The email service uses `/api/sendEmail` endpoint which runs on Vercel server

### Environment Variables Summary

**Client-Side (`.env.local` for local dev):**
```env
# Firebase (public, safe to expose)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=chriscandle-e8cbd.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chriscandle-e8cbd
# ... other Firebase vars
```

**Server-Side (Vercel Dashboard only):**
```env
# SendGrid (private, server-side only)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=mvalentina1990@outlook.com
```

## Troubleshooting

### Issue: Still getting "invalid, expired, or revoked" after updating

**Possible causes:**
- API key wasn't saved correctly in Vercel
- Didn't redeploy after updating environment variables
- Using wrong API key (copied incorrectly)
- API key was deleted/revoked in SendGrid

**Solution:**
1. Double-check API key in Vercel matches SendGrid dashboard
2. Verify you redeployed after updating
3. Create a fresh API key in SendGrid
4. Check SendGrid dashboard → API Keys to see if key is active

### Issue: Emails not sending but no error

**Check:**
1. Vercel function logs for errors
2. SendGrid Activity Feed for delivery status
3. Spam folder
4. Sender email is verified in SendGrid

### Issue: Works locally but not in production

**Solution:**
1. Verify `SENDGRID_API_KEY` is set in Vercel for **Production** environment
2. Check that you selected all environments when adding the variable
3. Redeploy production deployment

## Related Files

- `api/sendEmail.ts` - Vercel serverless function (uses `process.env.SENDGRID_API_KEY`)
- `src/lib/email.ts` - Client-side email service (calls `/api/sendEmail`)
- `.env.local` - Local environment variables (for development only)
- Vercel Dashboard → Environment Variables (for production)

## Next Steps

After fixing:
1. ✅ Test email sending works
2. ✅ Verify emails are received
3. ✅ Check Vercel function logs are clean
4. ✅ Remove any hardcoded API keys from code/docs
