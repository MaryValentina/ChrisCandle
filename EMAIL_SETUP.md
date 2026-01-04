# Email Setup Guide

ChrisCandle supports multiple email providers for sending notifications to participants.

## Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration
# Provider options: 'mock' (development), 'resend', 'sendgrid'
VITE_EMAIL_PROVIDER=mock
VITE_EMAIL_FROM=noreply@chriscandle.com

# Resend API (if using Resend)
VITE_RESEND_API_KEY=your_resend_api_key

# SendGrid API (if using SendGrid)
VITE_SENDGRID_API_KEY=your_sendgrid_api_key
```

## Email Providers

### Mock Mode (Development - Default)

No API key required. Emails are logged to the console.

```env
VITE_EMAIL_PROVIDER=mock
```

### Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add to `.env.local`:

```env
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx
VITE_EMAIL_FROM=onboarding@yourdomain.com
```

### SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key in Settings > API Keys
3. Add to `.env.local`:

```env
VITE_EMAIL_PROVIDER=sendgrid
VITE_SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
VITE_EMAIL_FROM=noreply@yourdomain.com
```

## Email Types

### 1. Welcome Email
Sent when a participant joins an event.

**Trigger:** Participant joins event  
**Content:** Event name, code, date, link to event page

### 2. Draw Completion Email
Sent when the organizer runs the draw.

**Trigger:** Organizer clicks "Start Draw"  
**Content:** Receiver's name, wishlist, event details

### 3. Reminder Emails
Sent automatically before the event.

**Triggers:**
- 1 week before event date
- 1 day before event date

**Content:** Event name, date, link to event page

## Reminder Scheduling

Reminders are currently set up with utility functions. In production, you'll need to:

1. **Firebase Cloud Functions + Cloud Scheduler:**
   - Create a scheduled function that runs daily
   - Check all active events
   - Send reminders if needed

2. **Backend Cron Job:**
   - Set up a daily cron job
   - Call `checkAndSendReminders()` with all active events

3. **AWS Lambda + EventBridge:**
   - Create a Lambda function
   - Schedule with EventBridge to run daily

## Testing

### Test Welcome Email
Join an event as a participant - email is sent automatically.

### Test Draw Email
Run the draw as an organizer - emails are sent to all participants.

### Test Reminders
Use the development helper:

```typescript
import { sendTestReminders } from './lib/reminders'

// In your component or test
await sendTestReminders(event)
```

## Email Templates

All email templates are HTML-based with:
- Christmas-themed styling
- Responsive design
- Clear call-to-action buttons
- Event details and links

Templates are defined in `src/lib/email.ts` and can be customized as needed.

