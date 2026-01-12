# SendGrid Email Integration Setup

This guide explains how to set up SendGrid email integration for the ChrisCandle Secret Santa app.

## Implementation Approach

The current implementation uses **event document update triggers** because participants are stored as an array within the event document. The function detects new participants by comparing the before/after participant arrays.

**Alternative:** If you prefer to use subcollections (`events/{eventId}/participants/{participantId}`), see `functions/src/index-subcollection.ts` for that implementation. You'll need to refactor the `addParticipant` function to write to subcollections instead of updating the array.

## Prerequisites

1. A SendGrid account (sign up at https://sendgrid.com)
2. Firebase project with Cloud Functions enabled
3. Firebase CLI installed and authenticated

## Step 1: Get SendGrid API Key

1. Log in to your SendGrid account
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it (e.g., "ChrisCandle Functions")
5. Select **Full Access** or **Restricted Access** with Mail Send permissions
6. Copy the API key (you won't be able to see it again!)

## Step 2: Configure Firebase Functions

### Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

### Login to Firebase

```bash
firebase login
```

### Set SendGrid API Key

**Option 1: Using sendgrid.env file (for local development)**

```bash
# Create sendgrid.env file (already in .gitignore)
echo "export SENDGRID_API_KEY='YOUR_SENDGRID_API_KEY_HERE'" > sendgrid.env

# Source it for local development
source ./sendgrid.env
```

**Option 2: Store in Firebase Functions config (for deployment)**

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY_HERE"
```

👉 This makes the key available securely inside your deployed functions.

### Set From Email Address (Optional)

```bash
firebase functions:config:set sendgrid.from="noreply@yourdomain.com"
```

**Note:** The "from" email must be verified in SendGrid. You can verify a single sender email in SendGrid dashboard under **Settings** → **Sender Authentication**.

### Set App Domain (Required for Email Links)

```bash
firebase functions:config:set app.domain="https://yourdomain.com"
```

Or for localhost development:
```bash
firebase functions:config:set app.domain="http://localhost:5173"
```

**Note:** This domain is used in email links. Update it to match your deployed app URL.

## Step 3: Install Function Dependencies

```bash
cd functions
npm install
```

**Make sure @sendgrid/mail is installed:**

```bash
npm install @sendgrid/mail
```

## Step 4: Build and Deploy Functions

```bash
# Build TypeScript
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

Or use the npm script:

```bash
npm run deploy
```

## Step 5: Verify Setup

1. Create a test event in your app
2. Add a participant with a valid email
3. Check the participant's inbox for the welcome email
4. Check the organizer's inbox for the notification email

## Testing Locally

You can test functions locally using the Firebase emulator:

```bash
cd functions
npm run serve
```

Then trigger the function by updating an event document in the emulator.

## Monitoring

View function logs:

```bash
firebase functions:log
```

Or in the Firebase Console: https://console.firebase.google.com/project/YOUR_PROJECT/functions

## Troubleshooting

### Emails Not Sending

1. **Check SendGrid API Key:**
   ```bash
   firebase functions:config:get
   ```
   Verify `sendgrid.key` is set correctly.

2. **Check Function Logs:**
   ```bash
   firebase functions:log
   ```
   Look for error messages.

3. **Verify SendGrid Account:**
   - Check SendGrid dashboard for any account issues
   - Verify your API key has Mail Send permissions
   - Check if you've hit rate limits

4. **Verify Sender Email:**
   - The "from" email must be verified in SendGrid
   - Check **Settings** → **Sender Authentication** in SendGrid

### Function Not Triggering

1. **Check Firestore Rules:**
   - Ensure events can be updated
   - Check that the function has proper permissions

2. **Check Function Deployment:**
   ```bash
   firebase functions:list
   ```
   Verify `onParticipantJoined` is deployed.

3. **Check Event Updates:**
   - The function triggers on event document updates
   - Ensure participants array is actually being updated

## Email Templates

The email templates are defined in `functions/src/index.ts`. You can customize:
- HTML styling
- Email content
- Links and buttons
- Branding

## Cost Considerations

- SendGrid Free Tier: 100 emails/day
- Firebase Functions: Free tier includes 2 million invocations/month
- Consider upgrading SendGrid plan for production use

## Security Notes

- Never commit API keys to version control
- Use Firebase Functions config for sensitive data
- Consider using Secret Manager for production (Firebase Functions v2)
