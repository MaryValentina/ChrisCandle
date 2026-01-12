# Firebase Cloud Functions for ChrisCandle

This directory contains Firebase Cloud Functions for sending transactional emails via SendGrid when participants join events.

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure SendGrid API Key

Set your SendGrid API key in Firebase config:

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

Optionally, set a custom "from" email address:

```bash
firebase functions:config:set sendgrid.from="noreply@yourdomain.com"
```

### 3. Build and Deploy

```bash
npm run build
firebase deploy --only functions
```

## Functions

### `onParticipantJoined`

**Current Implementation (Array-based):**
- **Trigger:** Firestore document update on `events/{eventId}`
- **How it works:** Compares before/after participant arrays to detect new additions
- **Why:** Participants are currently stored as an array in the event document

**Alternative Implementation (Subcollection-based):**
- See `src/index-subcollection.ts` for subcollection approach
- **Trigger:** Firestore document create on `events/{eventId}/participants/{participantId}`
- **Requires:** Refactoring `addParticipant` to write to subcollections

**What it does:**
- Detects when new participants are added to an event
- Sends a welcome email to the new participant
- Sends a notification email to the event organizer

**Emails sent:**
1. **Welcome Email** (to participant):
   - Event name, date, budget
   - Event code
   - Link to view event and add wishlist
   - Reminder about wishlist

2. **Notification Email** (to organizer):
   - New participant name and email
   - Total participant count
   - Link to admin dashboard

## Development

### Local Testing

```bash
npm run serve
```

This starts the Firebase emulators. You can test functions locally.

### View Logs

```bash
npm run logs
```

Or view in Firebase Console: https://console.firebase.google.com

## Notes

- The function triggers on event document updates and compares participant arrays to detect new additions
- Organizers (marked with `isOrganizer: true`) do not receive welcome emails
- Participants without email addresses are skipped
- If SendGrid API key is not configured, emails are logged but not sent (useful for development)
