# Vercel Email Setup Guide

This guide explains how to set up email services using Vercel serverless functions instead of Firebase Cloud Functions.

## Overview

Email functionality has been migrated from Firebase Cloud Functions to Vercel serverless functions:
- **Frontend**: `src/lib/email.ts` - Calls `/api/sendEmail` endpoint
- **Backend**: `api/sendEmail.ts` - Vercel serverless function that sends emails via SendGrid

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A SendGrid account with an API key
3. Your app deployed to Vercel (or ready to deploy)

## Step 1: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

### Firebase Configuration (Required)

Your Firebase project ID is: `chriscandle-e8cbd`

To get your Firebase config values:
1. Go to [Firebase Console](https://console.firebase.google.com/project/chriscandle-e8cbd/settings/general)
2. Click on the gear icon ⚙️ next to "Project Overview"
3. Select "Project settings"
4. Scroll down to "Your apps" section
5. If you don't have a web app, click "Add app" → Web (</> icon)
6. Copy the config values from the `firebaseConfig` object

Add these environment variables in Vercel:

- **`VITE_FIREBASE_API_KEY`**
  - Value: Your Firebase API key (from Firebase Console)
  - Environment: Production, Preview, Development (select all)

- **`VITE_FIREBASE_AUTH_DOMAIN`**
  - Value: `chriscandle-e8cbd.firebaseapp.com`
  - Environment: Production, Preview, Development (select all)

- **`VITE_FIREBASE_PROJECT_ID`**
  - Value: `chriscandle-e8cbd`
  - Environment: Production, Preview, Development (select all)

- **`VITE_FIREBASE_STORAGE_BUCKET`** (Optional but recommended)
  - Value: `chriscandle-e8cbd.appspot.com`
  - Environment: Production, Preview, Development (select all)

- **`VITE_FIREBASE_MESSAGING_SENDER_ID`** (Optional)
  - Value: From Firebase Console
  - Environment: Production, Preview, Development (select all)

- **`VITE_FIREBASE_APP_ID`** (Optional)
  - Value: From Firebase Console
  - Environment: Production, Preview, Development (select all)

### SendGrid Configuration (Required for Email)

- **`SENDGRID_API_KEY`**
  - Value: Your SendGrid API key (e.g., `SG.xxxxxxxxxxxxx`)
  - Environment: Production, Preview, Development (select all)

- **`SENDGRID_FROM_EMAIL`** (Optional)
  - Value: Your verified sender email
  - Default: `mvalentina1990@outlook.com` (already verified in SendGrid)
  - Environment: Production, Preview, Development (select all)
  - **Note**: The default sender email `mvalentina1990@outlook.com` is already verified in SendGrid

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

### Option B: Deploy via GitHub Integration

1. Connect your GitHub repository to Vercel
2. Vercel will automatically deploy on every push to your main branch
3. Environment variables set in the dashboard will be used automatically

## Step 3: Verify Deployment

1. After deployment, check that your API endpoint is accessible:
   ```
   https://your-project.vercel.app/api/sendEmail
   ```

2. Test the endpoint (you can use curl or Postman):
   ```bash
   curl -X POST https://your-project.vercel.app/api/sendEmail \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test@example.com",
       "subject": "Test Email",
       "html": "<h1>Test</h1>",
       "text": "Test"
     }'
   ```

## Step 4: Update Frontend Configuration (Optional)

The frontend is already configured to use the Vercel endpoint by default in production. If you need to customize:

1. Set environment variable `VITE_EMAIL_PROVIDER=vercel` (default in production)
2. The frontend will automatically call `/api/sendEmail` when emails need to be sent

## Email Types Supported

The following email types are supported:
- **Welcome Email**: Sent when a participant joins an event
- **Organizer Notification**: Sent to organizer when a new participant joins
- **Draw Email**: Sent when assignments are revealed
- **Reminder Email**: Sent as event reminders

## Troubleshooting

### Firebase Auth Not Configured

If you see "Firebase Auth is not configured" error:

1. **Verify Environment Variables in Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Ensure all `VITE_FIREBASE_*` variables are set
   - Make sure they're enabled for Production, Preview, and Development

2. **Get Firebase Config Values**:
   - Go to [Firebase Console](https://console.firebase.google.com/project/chriscandle-e8cbd/settings/general)
   - Click ⚙️ → Project settings
   - Scroll to "Your apps" section
   - Click on your web app (or create one if it doesn't exist)
   - Copy the config values from the `firebaseConfig` object

3. **Redeploy After Adding Variables**:
   - After adding environment variables, Vercel needs to redeploy
   - Go to Deployments → Click "..." → Redeploy
   - Or push a new commit to trigger automatic deployment

4. **Check Variable Names**:
   - All Firebase variables MUST start with `VITE_` prefix
   - Example: `VITE_FIREBASE_API_KEY` (not `FIREBASE_API_KEY`)

### Emails Not Sending

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions
   - Check logs for errors

2. **Verify Environment Variables**:
   - Ensure `SENDGRID_API_KEY` is set correctly
   - Check that `SENDGRID_FROM_EMAIL` is verified in SendGrid

3. **Check SendGrid Account**:
   - Verify your API key has "Mail Send" permissions
   - Check SendGrid dashboard for rate limits or account issues
   - Ensure sender email is verified

### Function Not Found (404)

- Ensure `vercel.json` is in the project root
- Check that `api/sendEmail.ts` exists
- Verify the deployment includes the `api/` directory

### CORS Issues

- Vercel functions handle CORS automatically
- If issues persist, check that requests are coming from the same domain

## Migration from Firebase Functions

If you were previously using Firebase Cloud Functions:

1. ✅ Email logic has been removed from `functions/src/index.ts`
2. ✅ Frontend now calls Vercel endpoint instead
3. ✅ No Firebase Functions deployment needed for emails
4. ⚠️ You can still use Firebase Functions for other purposes if needed

## Cost Considerations

- **Vercel Free Tier**: 100GB-hours of serverless function execution per month
- **SendGrid Free Tier**: 100 emails/day
- For production use, consider upgrading SendGrid plan

## Security Notes

- Never commit API keys to version control
- Use Vercel environment variables for sensitive data
- The API endpoint validates email format and required fields
- SendGrid API key is only accessible server-side

## Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Check SendGrid documentation: https://docs.sendgrid.com
- Review function logs in Vercel dashboard
