# Quick SendGrid Setup

## 1. Environment Variables Setup

**Never commit real API keys. Use environment variables.**

### Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your SendGrid API key to `.env`:
   ```env
   SENDGRID_API_KEY=YOUR_KEY_HERE
   ```

### Firebase Functions Config

For deployed functions, you need to set it in Firebase:

```bash
# Set SendGrid API Key
firebase functions:config:set sendgrid.key="YOUR_KEY_HERE"

# Set App Domain (for email links)
# Replace with your actual deployed domain
firebase functions:config:set app.domain="https://yourdomain.com"

# Or for localhost development:
# firebase functions:config:set app.domain="http://localhost:5173"
```

## 2. Install Dependencies

```bash
cd functions
npm install
```

## 3. Build Functions

```bash
npm run build
```

## 4. Deploy Functions

```bash
firebase deploy --only functions
```

Or from the functions directory:

```bash
npm run deploy
```

## 5. Domain Configuration

The domain is now configurable via Firebase Functions config (see step 1). The email templates will automatically use the domain you set in `app.domain` config.

If you need to change it later:
```bash
firebase functions:config:set app.domain="https://your-new-domain.com"
```

## 6. Test

1. Create a test event
2. Add a participant with a valid email
3. Check both inboxes:
   - Participant should receive welcome email
   - Organizer should receive notification email

## View Logs

```bash
firebase functions:log
```

Or check Firebase Console: https://console.firebase.google.com/project/chriscandle-e8cbd/functions
